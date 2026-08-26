# 1. Frontend Architecture

**Паттерн: MVVM, максимально простой, SwiftUI-native.**

Структура папок (Xcode groups):

```
LinguaApp/
├── App/
│   └── LinguaAppApp.swift
├── DesignSystem/
│   ├── AppColors.swift
│   ├── AppTypography.swift
│   ├── Spacing.swift
│   ├── CornerRadius.swift
│   ├── ButtonStyles.swift
│   ├── CardStyle.swift
│   └── ProgressStyles.swift
├── Models/
│   ├── User.swift
│   ├── Goal.swift
│   ├── Skill.swift
│   ├── Mission.swift
│   ├── Activity.swift
│   └── MascotState.swift
├── MockData/
│   └── MockData.swift
├── Mascot/
│   ├── MascotView.swift
│   ├── MascotStage.swift
│   ├── MascotMood.swift
│   └── MascotViewModel.swift
├── Components/
│   ├── PrimaryButton.swift
│   ├── Card.swift
│   ├── ProgressBar.swift
│   ├── SkillPill.swift
│   └── LoadingStateView.swift
├── Features/
│   ├── Onboarding/
│   │   ├── Welcome/
│   │   ├── GoalInput/
│   │   └── SkillsPreview/
│   ├── Home/
│   ├── Mission/
│   │   ├── MissionPreview/
│   │   ├── MissionContainer/
│   │   └── Activities/
│   │       ├── MultipleChoiceActivityView.swift
│   │       ├── ShortAnswerActivityView.swift
│   │       ├── SpeakingActivityView.swift
│   │       └── ListeningActivityView.swift
│   ├── MissionComplete/
│   ├── Goals/
│   ├── Skills/
│   ├── Library/
│   └── Profile/
└── Navigation/
    ├── AppRouter.swift
    └── RootView.swift

```

**Почему так:**

- Каждый Feature = собственная папка с `View` + `ViewModel`. Это позволяет тебе (и мне) находить любой экран за секунды.
- Design System и Components отделены от Features — их переиспользуют все экраны.
- Mascot — отдельный самостоятельный модуль, не зависящий ни от одного конкретного экрана.
- Никакого Coordinator-паттерна, никакого DI-контейнера, никакого Combine, если не понадобится — это overengineering для MVP.

ViewModel'и будут простыми `ObservableObject` с `@Published` properties. Для MVP этого достаточно, Combine/async сложные пайплайны не нужны.

---

# 2. Mock Data Architecture

Все модели — простые `struct`, `Identifiable`, `Codable` (Codable — на будущее, для API, ничего не стоит добавить сейчас).

```swift
struct MockUser {
    let name: String
    let targetLanguage: String
    let interfaceLanguage: String
}

struct Goal: Identifiable {
    let id: UUID
    let title: String              // "Prepare for English job interviews"
    let rawUserInput: String       // что человек написал сам
    let relevantSkills: [SkillType]
    let progress: Double           // 0.0...1.0
    let isActive: Bool
}

enum SkillType: String, CaseIterable {
    case speaking, listening, vocabulary, grammar, reading, writing
}

struct SkillState: Identifiable {
    let id: UUID
    let type: SkillType
    let level: SkillLevel          // basic / developing / functional / advanced
    let trend: Trend               // up / stable / down
}

enum SkillLevel: String { case basic, developing, functional, advanced }
enum Trend { case up, stable, down }

struct Mission: Identifiable {
    let id: UUID
    let title: String
    let whyItMatters: String
    let primarySkill: SkillType
    let estimatedMinutes: Int
    let difficulty: Difficulty
    let activities: [Activity]
}

enum Difficulty: String { case easy, medium, hard }

struct Activity: Identifiable {
    let id: UUID
    let type: ActivityType
    let prompt: String
    let content: ActivityContent    // enum с ассоциированными значениями под каждый тип
}

enum ActivityType { case multipleChoice, fillInBlank, shortAnswer, speaking, listening }

struct MascotState {
    var stage: MascotStage      // baby / growing / young / developed / advanced
    var mood: MascotMood        // neutral / happy / excited / thinking / celebrating
    var growthProgress: Double  // прогресс внутри текущей stage, 0.0...1.0
}

```

Один файл `MockData.swift` с готовыми реалистичными примерами (не Lorem Ipsum): реальная цель "Prepare for English job interviews", реальные миссии, реальные фразы фидбэка. Это тебе сразу даст ощущение живого продукта, когда будешь смотреть на экраны.

Ключевое архитектурное решение: **UI никогда не обращается к MockData напрямую** — только через ViewModel/Repository-протокол (`GoalRepository`, `MissionRepository` и т.д.), реализованный сейчас через mock, а позже — через API. Так замена mock → backend не потребует переписывать ни одного View.

---

# 3. Navigation Architecture

`NavigationStack` (iOS 16+) + `TabView`.

```
RootView
├── (if onboarding not completed) OnboardingFlow — NavigationStack
│     Welcome → GoalInput → SkillsPreview → (Home)
└── (if onboarding completed) MainTabView
      ├── Home tab       (NavigationStack)
      ├── Goals tab      (NavigationStack)
      ├── Library tab    (NavigationStack)   ← P2, добавим позже
      └── Profile tab    (NavigationStack)

```

Про `Learn` таб из твоего исходного списка: я предлагаю **не делать отдельный таб**, потому что product principle гласит — пользователь не должен сам решать, что учить. "Learn" как каталог уроков противоречит идее "one best next action". Вместо этого:

- **Home** — это и есть "Learn" (там живёт mission flow);
- **Goals** — где цель и её skills;
- **Library** — опционален, добавим в P2 как источник материалов, а не как каталог уроков.

Итоговый MVP tab bar: **Home / Goals / Profile** (Library добавим позже как 4-й таб или встроим внутрь Goal Detail — решим когда дойдём до P2).

Mission flow (Preview → Mission → Activities → Complete) — это **modal full-screen flow**, а не часть tab navigation, потому что это "режим фокуса" — пользователь не должен переключать табы посреди Mission.

Роутинг — простой `enum AppRoute` + `NavigationPath`, без сторонних библиотек.

---

# 4. Mascot Architecture

```swift
enum MascotStage: String, CaseIterable { case baby, growing, young, developed, advanced }
enum MascotMood: String { case neutral, happy, excited, thinking, celebrating }
enum MascotSize { case small, medium, large }

struct MascotView: View {
    let stage: MascotStage
    let mood: MascotMood
    let size: MascotSize
    // internal: subtle idle float animation, scale/opacity transitions on mood change
}

```

- `MascotViewModel` (или просто computed state внутри HomeViewModel/AppState) хранит текущий `MascotState` — единый источник правды, чтобы маскот выглядел одинаково на Home, Mission Complete, Profile.
- На MVP визуально: **SF Symbols или простые SwiftUI-shape композиции** как placeholder (например, круглое "тело" + анимируемые "глаза"), никаких кастомных иллюстраций пока не нужно — легко заменить позже на асеты/Lottie, потому что View принимает только enum-состояния, а не конкретную реализацию отрисовки.
- Анимации: `.animation(.easeInOut)` на смену mood/stage, лёгкий idle bounce через `TimelineView` или повторяющийся `withAnimation` — ничего тяжелее не требуется.
- Правило появления: Home (главный), Mission Complete (celebrating), Initial Result онбординга, Empty states. НЕ на каждом экране.

---

# 5. Reusable UI Components


| Компонент                      | Назначение                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `PrimaryButton`                | основной CTA-стиль ("Start Mission", "Get Started")                                                  |
| `SecondaryButton`              | вторичные действия                                                                                   |
| `Card`                         | контейнер с фоном/тенью/радиусом для Goal, Mission preview и т.п.                                    |
| `ProgressBar` / `ProgressRing` | skill progress, mission progress                                                                     |
| `SkillPill`                    | маленький бейдж skill + level                                                                        |
| `ActivityContainerView`        | один reusable контейнер, рендерящий нужный `ActivityType` внутри (вместо 5 разных экранов-навигаций) |
| `FeedbackBanner`               | "Not quite" / "You're getting closer" — тёплый tone, без "WRONG"                                     |
| `LoadingStateView`             | человеко-дружелюбные loading-сообщения вместо технических                                            |
| `EmptyStateView`               | параметризуемый empty state (Goal, Mission) с маскотом                                               |
| `MascotView`                   | см. выше                                                                                             |


Design System (`AppColors`, `AppTypography`, `Spacing`, `CornerRadius`) — один источник правды, никаких хардкодов hex/pt по всему коду.

---

# 6. Final Screen Implementation Order (P0)

1. **Design System + Mock Models skeleton** (не экран, но нужен всем экранам сразу)
2. **Welcome** — самый простой, задаёт tone и стиль маскота
3. **Goal Input**
4. **Skills Preview**
5. **Home** — ключевой экран, соберёт Card/ProgressBar/MascotView вместе
6. **Mission Preview**
7. **Mission (container)**
8. **Multiple Choice Activity**
9. **Short Answer Activity**
10. **Speaking Activity** (симулированная запись)
11. **Mission Complete**

Это даёт полный **сквозной проходимый flow** от первого запуска до завершения первой миссии — то, что реально можно показать инвестору/другу как работающий прототип.

---

# 7. Risks / Technical Simplifications

- **Speech-to-text на Speaking-экране** будет полностью замокан (fake "recording" state → fake transcript → fake feedback). Реальная интеграция с Speech framework — отдельная задача после MVP.
- **AI-фидбэк** (Short Answer, Goal Clarification) — заранее заготовленные mock-ответы, не настоящий LLM-вызов. Легко заменить, т.к. UI зависит от протокола `FeedbackProvider`, а не от конкретной реализации.
- **Только один активный Goal** на MVP — список нескольких целей (Goal List) сознательно отложен в P2, чтобы не усложнять data model раньше времени.
- **Один target language** захардкожен на старте, но enum `Language` делаем расширяемым сразу, чтобы не переписывать модель позже.
- **Audio player на Listening** — plaeholder/silent, поскольку это P2 и в первый проход не нужен.
- Никакого Core Data / SwiftData на этом этапе — состояние живёт в памяти (`@StateObject`/environment object), персистентность добавим, когда появится реальный backend.

---

Жду команды **"START SCREEN 1"**, чтобы начать с Design System + Mock Models, а затем перейти к Welcome.