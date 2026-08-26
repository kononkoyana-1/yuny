# **MVP PRODUCT SPECIFICATION**

## **I. PRODUCT SYSTEM**

# **1\. MVP User Flow & System Flow**

## **1\. Цель**

Зафиксировать полный путь пользователя в MVP и одновременно показать, что происходит внутри системы на каждом этапе.

Эта глава должна стать связующим звеном между:

* PRD V2;  
* UX;  
* backend;  
* AI;  
* database;  
* будущей разработкой через AI coding tools.

Главная задача:

> определить **минимальный работающий Learning Loop**, который мы реально сможем собрать одной командой: Founder \+ AI.

---

# **2\. Главный принцип**

Пользователь не должен сначала изучать устройство приложения.

Он должен пройти естественный путь:

«У меня есть цель»  
        ↓  
«Когда я хочу её достичь?»  
        ↓  
«Сколько времени я могу уделять?»  
        ↓  
«Реалистично ли это?»  
        ↓  
«Что именно мне нужно уметь на языке?»  
        ↓  
«Что мне сейчас делать?»  
        ↓  
«Я это сделал»  
        ↓  
«Что я теперь умею лучше?»  
        ↓  
«Что делать дальше?»

Это и есть MVP experience.

---

# **3\. End-to-End User Flow**

Open App  
   ↓  
Onboarding  
   ↓  
Select Target Language  
   ↓  
Create Goal  
   ↓  
Set Deadline  
   ↓  
Set Available Time  
   ↓  
AI Feasibility Analysis  
   ↓  
Goal Adjustment  
   ↓  
Confirm Goal  
   ↓  
Initial Assessment  
   ↓  
Goal Language Profile  
   ↓  
Learning Strategy  
   ↓  
Dashboard  
   ↓  
Today's Recommendation  
   ↓  
Mission  
   ↓  
Activities  
   ↓  
Evidence  
   ↓  
Learning State Update  
   ↓  
Mascot Progress  
   ↓  
Next Recommendation  
---

# **4\. Этап 1 — Onboarding**

MVP onboarding должен быть коротким.

Не нужно собирать десятки параметров.

Минимально:

### **Шаг 1**

> Какой язык ты хочешь учить?

### **Шаг 2**

> Зачем тебе этот язык?

Пользователь формулирует Goal своими словами.

Например:

> «Хочу пройти собеседование на английском».

### **Шаг 3**

> Когда ты хочешь достичь этой цели?

### **Шаг 4**

> Сколько времени в день ты реально готов уделять языку?

---

# **5\. Почему мы спрашиваем реальное время**

Очень важно различать:

> **Desired Time**

и

> **Available Time**

Пользователь может хотеть заниматься:

> 60 минут в день.

Но реально способен:

> 15 минут.

Для MVP спрашиваем:

> **Сколько времени ты реально готов уделять языку в обычный день?**

Пользователь может изменить это значение позже.

---

# **6\. Этап 2 — Goal Analysis**

После ввода:

Goal  
\+  
Target Language  
\+  
Deadline  
\+  
Available Time

система запускает Goal Analysis.

AI определяет:

* тип Goal;  
* необходимый контекст;  
* предполагаемые Language Outcomes;  
* Language Situations;  
* Required Skills;  
* приблизительную сложность;  
* потенциальные языковые требования.

---

# **7\. Этап 3 — Feasibility**

Система показывает пользователю не один ответ, а **варианты**.

Например:

### **Твоя цель**

> Пройти собеседование на английском.

### **Deadline**

> 31 декабря 2026

### **Текущее время**

> 15 минут в день

### **Оценка**

> **Достижимо**

И варианты:

10 мин/день  
→ низкая вероятность

15 мин/день  
→ достижимо

30 мин/день  
→ высокая вероятность

45 мин/день  
→ высокая вероятность \+ больше запас

Точные сроки и оценки должны подаваться как **ориентировочные**, а не как математически гарантированный прогноз.

---

# **8\. Goal Adjustment**

Пользователь может изменить:

* Deadline;  
* Available Time;  
* контекст Goal.

После изменения система пересчитывает рекомендации.

Например:

> Я могу заниматься только 10 минут.

AI:

> Тогда цель всё ещё возможна, но потребуется больше времени.

Пользователь:

> Окей.

или:

> Нет, я хочу заниматься 20 минут.

AI:

> При 20 минутах вероятность достижения цели выше.

---

# **9\. Важная UX-деталь**

Мы **не должны заставлять пользователя принимать AI-рекомендацию**.

Система должна говорить:

> «Вот что я рекомендую».

а не:

> «Вот ваш план».

Пользователь является владельцем Goal.

---

# **10\. Goal Confirmation**

После корректировки пользователь подтверждает:

> **Start Learning**

В этот момент Goal получает статус:

**Active**

И система создаёт первоначальную Learning Strategy.

---

# **11\. Этап 4 — Initial Assessment**

После создания Goal пользователь проходит короткую диагностику.

Важно:

> Assessment должен быть связан с Goal.

Например:

### **Goal**

Interview

Система проверяет прежде всего:

* Speaking;  
* Listening;  
* Vocabulary;  
* relevant Grammar.

А не весь язык одинаково.

---

# **12\. Adaptive Assessment**

MVP может начинать с фиксированного набора заданий.

После первых результатов AI определяет:

> достаточно ли Evidence?

Если нет:

Additional Assessment

Если да:

Assessment Complete

Это позволит постепенно перейти к более адаптивной диагностике без построения сложной системы сразу.

---

# **13\. Этап 5 — Language Profile**

После Assessment система формирует:

### **Current State**

Что пользователь умеет сейчас.

### **Required State**

Что требуется для Goal.

### **Gap**

Где находится разрыв.

Например:

Interview Speaking  
Current: A2+  
Required: B1+  
Gap: Significant

Listening  
Current: B1  
Required: B1+  
Gap: Moderate

Professional Vocabulary  
Current: A2  
Required: B1  
Gap: Significant  
---

# **14\. Этап 6 — Learning Strategy**

Decision Engine определяет приоритеты.

Например:

Priority 1  
Interview Speaking

Priority 2  
Professional Vocabulary

Priority 3  
Listening

Priority 4  
Grammar

Почему Grammar может оказаться не на первом месте?

Потому что продукт оптимизирует:

> **Goal outcome**

а не прохождение грамматической программы.

---

# **15\. Этап 7 — Dashboard**

После Assessment пользователь попадает на главный экран.

Dashboard показывает:

### **Mascot**

Текущее состояние персонажа.

### **Active Goal**

> Pass English Interview

### **Deadline**

> 31 Dec 2026

### **Goal Readiness**

На MVP:

> **Getting Ready**

или визуальный индикатор.

### **Today's Mission**

> Practice answering behavioral interview questions.

### **Why?**

> Your speaking is currently the biggest gap for this goal.

---

# **16\. Этап 8 — Mission**

Пользователь нажимает:

> **Start Mission**

Mission содержит:

### **Objective**

Что пользователь должен научиться делать.

### **Context**

В какой реальной языковой ситуации это понадобится.

### **Activities**

Последовательность небольших действий.

Например:

1\. Learn useful phrases  
2\. Listen to example answer  
3\. Practice response  
4\. Answer interview question  
5\. Receive AI feedback  
6\. Try again  
---

# **17\. Этап 9 — Evidence**

После выполнения Mission система анализирует результаты.

Например:

Speaking  
Fluency: improving  
Vocabulary: weak  
Grammar: acceptable  
Confidence: medium

И создаёт Evidence.

Важно:

> **Completed Mission ≠ Learning Evidence.**

Это принцип, который сохраняется из PRD.

---

# **18\. Этап 10 — Learning State Update**

Evidence обновляет Learning State.

Например:

Before

Interview Speaking  
A2+  
Confidence 0.68

After

Interview Speaking  
A2+/B1-  
Confidence 0.81

На MVP эти изменения могут быть достаточно грубыми.

Нам важнее доказать:

> **результат предыдущей активности влияет на следующее решение.**

---

# **19\. Этап 11 — Mascot**

После meaningful learning event Mascot получает Progress.

Например:

Mission completed  
\+  
Evidence generated  
\+  
Skill improved  
\=  
Mascot XP

Персонаж может:

* расти;  
* менять внешний вид;  
* открывать новые состояния;  
* реагировать на достижения.

Но он не должен превращаться в отдельную игру.

---

# **20\. Этап 12 — Next Recommendation**

После Mission система не показывает просто:

> «Урок завершён».

Она принимает новое решение.

Например:

> **Next recommended: Practice professional vocabulary**

Причина:

> You handled the interview structure well, but vocabulary limited your answers.

И пользователь может:

### **Start**

или

### **Later**

или

### **Choose something else**

Это сохраняет User Agency.

---

# **21\. Главный внутренний цикл**

После первого Mission система снова возвращается к Decision Engine:

Evidence  
↓  
Learning State  
↓  
Goal Gap  
↓  
Decision  
↓  
Recommendation  
↓  
Mission

То есть:

> **MVP уже является замкнутой системой адаптивного обучения.**

Пусть и очень простой.

---

# **22\. Где используется AI**

| Этап | AI |
| ----- | ----- |
| Goal interpretation | Да |
| Goal context | Да |
| Language Outcomes | Да |
| Feasibility | Да \+ Rules |
| Assessment | Да |
| Learning State | AI предлагает Evidence |
| Decision | Rules \+ structured data |
| Mission generation | Да |
| Activity generation | Да |
| Answer evaluation | Да |
| Feedback | Да |
| Next recommendation explanation | Да |
| Mascot logic | Нет |

Это принципиально:

> **Mascot, navigation, statuses и базовые правила не должны расходовать LLM tokens.**

---

# **23\. Что хранится в базе**

Минимальный поток данных:

User  
 ↓  
Goal  
 ↓  
Assessment  
 ↓  
Learning State  
 ↓  
Mission  
 ↓  
Activity Result  
 ↓  
Evidence  
 ↓  
Recommendation

Mascot State хранится отдельно, но изменяется на основании learning events.

---

# **24\. Что происходит при повторном входе**

Пользователь открывает приложение.

Backend получает:

* Active Goal;  
* Deadline;  
* Learning State;  
* last Evidence;  
* current Mission;  
* latest Recommendation.

Dashboard показывает:

> **Что сейчас наиболее полезно сделать?**

Это и есть основной смысл LOS.

---

# **25\. Что происходит при пропуске**

Если пользователь не занимался несколько дней, MVP **не должен превращать это в наказание**.

Не:

> «Ты пропустил 4 дня\!»

А:

> «У тебя осталось X дней до Goal. Вот наиболее полезное действие на сегодня».

Система может пересчитать:

* доступное время;  
* прогноз;  
* Recommendation.

Mascot также не должен «умирать» или терять накопленный прогресс.

---

# **26\. Что происходит при изменении Deadline**

Пользователь может открыть Goal и изменить дату.

Например:

> Было: 31.12.2026  
> Стало: 30.09.2026

Система пересчитывает:

Deadline  
\+  
Current State  
\+  
Remaining Gap  
\+  
Available Time

и сообщает:

> «При текущих 15 минутах в день новая дата выглядит сложной. Чтобы повысить вероятность достижения цели, рекомендую 25 минут в день».

---

# **27\. Что происходит при изменении Available Time**

Аналогично.

Пользователь:

> Было 15 минут → стало 30 минут.

Система не должна просто сказать:

> «Отлично\!»

Она обновляет Learning Strategy.

То есть увеличение времени становится **образовательным параметром**, а не просто настройкой профиля.

---

# **28\. MVP Success Test**

Если мы сможем реализовать этот flow, мы сможем проверить главную гипотезу:

> Может ли AI-система превратить жизненную цель, Deadline и ограниченное время человека в адаптивный языковой путь?

Нам не требуется для этого:

* сложный Knowledge Graph;  
* полноценный ML;  
* мобильные приложения;  
* собственная LLM;  
* огромная библиотека;  
* сложная gamification.

---

# **29\. Product Decisions**

### **MVP-1.01**

MVP строится вокруг замкнутого Learning Loop.

### **MVP-1.02**

Goal, Deadline и Available Time являются входными параметрами системы.

### **MVP-1.03**

AI анализирует достижимость Goal, но пользователь принимает окончательное решение.

### **MVP-1.04**

Feasibility является рекомендацией, а не гарантией.

### **MVP-1.05**

Assessment связан с конкретной Goal.

### **MVP-1.06**

Learning Strategy определяется на основании Goal \+ Learning State.

### **MVP-1.07**

Mission является основной единицей пользовательского обучения.

### **MVP-1.08**

Evidence является связующим звеном между Activities и Learning State.

### **MVP-1.09**

Каждая значимая Activity потенциально может изменить следующую Recommendation.

### **MVP-1.10**

Mascot визуализирует learning progress и не является отдельной образовательной системой.

### **MVP-1.11**

MVP реализуется преимущественно через Rules \+ LLM \+ managed services.

---

# **30\. Assumptions**

* Пользователю понятна концепция Goal \+ Deadline \+ Time/day.  
* Пользователь готов принять AI-рекомендацию после возможности её изменить.  
* Короткая диагностика способна дать достаточно полезное начальное состояние.  
* Пользователь понимает Recommendation, если система объясняет её причину.  
* AI способен генерировать достаточно качественные Missions для первого MVP.  
* Простая модель Learning State будет достаточна для проверки основной гипотезы.

---

# **31\. Risks**

### **Overpromising Risk**

Feasibility может восприниматься как гарантия.

### **AI Assessment Risk**

LLM может неправильно оценить уровень.

### **Complexity Risk**

Даже этот flow может оказаться слишком большим для первой сборки.

### **UX Risk**

Слишком много шагов до первой полезной Activity.

### **Cost Risk**

AI calls на Assessment и Evaluation могут оказаться дорогими.

### **Motivation Risk**

Пользователь может потерять интерес ещё до первой Mission.

---

# **32\. Buildability Check**

| Компонент | Сложность | MVP |
| ----- | ----- | ----- |
| Authentication | Низкая | ✅ |
| Goal | Низкая | ✅ |
| Deadline | Низкая | ✅ |
| Time/day | Низкая | ✅ |
| Feasibility | Средняя | ✅ |
| Assessment | Средняя | ✅ |
| Learning State | Средняя | ✅ |
| Mission generation | Средняя | ✅ |
| AI Evaluation | Средняя | ✅ |
| Recommendation | Низкая/средняя | ✅ |
| Mascot | Низкая | ✅ |
| Public Library | Средняя | ✅ simplified |
| Knowledge Graph | Высокая | ❌ |
| ML Decision Engine | Высокая | ❌ |
| Native mobile | Средняя/высокая | ❌ |
| Complex gamification | Высокая | ❌ |

---

# **33\. Acceptance Criteria**

Глава считается завершённой, если мы можем построить прототип, в котором пользователь:

* создаёт Goal;  
* выбирает язык;  
* устанавливает Deadline;  
* устанавливает Available Time;  
* получает Feasibility Analysis;  
* может изменить параметры;  
* подтверждает Goal;  
* проходит начальную диагностику;  
* получает Language Profile;  
* получает первую Recommendation;  
* начинает Mission;  
* выполняет Activity;  
* получает AI Feedback;  
* создаёт Evidence;  
* видит обновление Learning State;  
* получает следующую Recommendation;  
* видит прогресс Mascot.

---

# **34\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| Goal Before Content | ✅ |
| Goal \+ Deadline \+ Time | ✅ |
| Language Outcomes over Life Tasks | ✅ |
| Decision Before Generation | ✅ |
| Evidence Before Assumption | ✅ |
| Continuous Adaptation | ✅ |
| User Agency | ✅ |
| AI as Execution Layer | ✅ |
| MVP Buildability | ✅ |
| Low Infrastructure Complexity | ✅ |
| Low AI Cost | ⚠️ требует тестирования |
| Public Knowledge Library | ✅ simplified |
| Mascot | ✅ |
| No Life Management | ✅ |

---

## **Итог**

Мы зафиксировали **не идеальную архитектуру LOS, а минимальный работающий цикл**, который реально можно попробовать собрать одной тебе с помощью AI.

Следующая глава будет:

# **2\. Core User States**

## **1\. Цель**

**Определить основные состояния пользователя и обучения в MVP, чтобы система всегда понимала:**

> **где пользователь находится сейчас, что уже произошло и какое действие допустимо следующим.**

**Это необходимо не только для UX, но и для AI-архитектуры, базы данных и разработки через AI coding tools.**

**Мы не должны позволять AI самостоятельно придумывать переходы между экранами и состояниями.**

---

# **2\. Контекст**

**MVP строится вокруг замкнутого цикла:**

**Goal**

**↓**

**Assessment**

**↓**

**Learning State**

**↓**

**Decision**

**↓**

**Recommendation**

**↓**

**Mission**

**↓**

**Activities**

**↓**

**Evidence**

**↓**

**Learning State Update**

**↓**

**Next Decision**

**Поэтому необходимо разделять:**

### **User State**

**В каком состоянии находится пользователь относительно продукта.**

### **Goal State**

**В каком состоянии находится его цель.**

### **Learning State**

**Что сейчас известно о его языковых компетенциях.**

### **Mission State**

**На каком этапе текущего обучения он находится.**

### **Activity State**

**Что происходит с конкретным заданием.**

**Это разные состояния и не должны смешиваться.**

---

# **3\. User State**

**В MVP пользователь может находиться в одном из следующих основных состояний:**

**New**

**↓**

**Onboarding**

**↓**

**Goal Setup**

**↓**

**Assessment**

**↓**

**Learning**

**↓**

**Paused**

**После достижения Goal:**

**Learning**

**↓**

**Goal Completed**

**↓**

**New Goal / Continuous Learning / Pause**

---

# **4\. New**

**Пользователь создал аккаунт или впервые открыл приложение, но ещё не завершил onboarding.**

### **Пользователь видит**

**Минимальное приветствие и предложение начать.**

### **Пользователь может**

> **Start**

### **Система должна**

**Создать минимальный профиль.**

**Не нужно заставлять пользователя заполнять длинную анкету.**

---

# **5\. Onboarding**

**Пользователь отвечает на минимальные вопросы:**

* **target language;**  
* **Goal;**  
* **Deadline;**  
* **Available Time.**

**Дополнительные вопросы появляются только при необходимости.**

### **Важный принцип**

**Onboarding не должен пытаться сразу построить полную модель пользователя.**

**Мы собираем минимум информации, необходимый для первого полезного решения.**

---

# **6\. Goal Setup**

**После первичного ввода пользователь находится в состоянии создания Goal.**

**Система:**

1. **анализирует Goal;**  
2. **определяет языковой контекст;**  
3. **оценивает требования;**  
4. **рассчитывает Feasibility;**  
5. **предлагает изменения.**

**Пользователь может редактировать параметры.**

**Пока пользователь не подтвердил Goal:**

> **Active Goal ещё не существует.**

---

# **7\. Assessment**

**После подтверждения Goal пользователь переходит в Initial Assessment.**

**Система должна определить минимально необходимый Learning State.**

**Assessment может быть:**

* **начальным;**  
* **дополнительным;**  
* **повторным.**

**На MVP не требуется отдельная сложная система экзаменов.**

---

# **8\. Learning**

**Это основное состояние пользователя.**

**Пользователь имеет:**

* **Active Goal;**  
* **Learning State;**  
* **Learning Strategy;**  
* **Recommendation;**  
* **текущую или следующую Mission.**

**В этом состоянии находится основная часть пользовательского времени.**

---

# **9\. Paused**

**Пользователь может временно остановить обучение.**

**Причины не должны требоваться обязательно.**

**Например:**

> **«Сейчас у меня нет времени».**

**При Pause:**

* **Goal сохраняется;**  
* **Learning State сохраняется;**  
* **Evidence сохраняется;**  
* **Mascot progress сохраняется.**

**Система не должна воспринимать отсутствие активности как потерю достигнутых знаний.**

**После возвращения:**

**Paused**

**↓**

**Resume**

**↓**

**State Review**

**↓**

**Updated Recommendation**

---

# **10\. Goal State**

**Goal имеет собственный lifecycle.**

**Draft**

**↓**

**Active**

**↓**

**Completed**

**Дополнительно:**

**Active → Paused**

**Active → Archived**

**Draft → Archived**

---

# **11\. Draft Goal**

**Goal создана, но ещё не подтверждена.**

**Например:**

> **«Хочу свободно говорить по-немецки».**

**Система может попросить уточнить:**

* **ситуацию;**  
* **контекст;**  
* **Deadline;**  
* **доступное время.**

**Draft Goal не влияет на Learning Strategy.**

---

# **12\. Active Goal**

**Это единственная Goal, которая определяет текущую стратегию обучения.**

**У пользователя может существовать несколько Goals, но:**

> **только одна Goal может быть Active одновременно.**

**Это сохраняет фокус и упрощает Decision Engine.**

---

# **13\. Paused Goal**

**Goal временно не является текущей.**

**При этом:**

* **прогресс сохраняется;**  
* **Learning State сохраняется;**  
* **Evidence сохраняется.**

**Пользователь может вернуться к ней позже.**

---

# **14\. Completed Goal**

**Goal считается Completed, когда система и пользователь считают, что необходимый языковой результат достигнут.**

**Важно:**

> **Completed Goal ≠ Perfect Language.**

**Пользователь не обязан достичь идеального уровня языка.**

**Он должен достичь достаточной готовности для заявленной Goal.**

**Например:**

> **пользователь хотел пройти англоязычное интервью.**

**Если assessment показывает необходимую готовность к целевым interview situations, Goal может быть отмечена как Completed.**

---

# **15\. Learning State**

**Learning State имеет несколько независимых компонентов.**

**Минимальная MVP-модель:**

**Skill**

**Current Estimate**

**Confidence**

**Priority**

**Evidence**

**Last Assessed**

**Например:**

**Speaking / Interview**

**Estimate: A2+**

**Confidence: High**

**Priority: High**

**Listening / Interview**

**Estimate: B1**

**Confidence: Medium**

**Priority: Medium**

**Professional Vocabulary**

**Estimate: A2**

**Confidence: High**

**Priority: High**

---

# **16\. Почему Confidence необходим**

**AI может ошибаться.**

**Поэтому:**

> **оценка без уверенности создаёт ложную точность.**

**Например:**

**Speaking: B1**

**Confidence: Low**

**означает:**

> **система предполагает B1, но Evidence пока недостаточно.**

**Это может привести к дополнительной диагностике.**

---

# **17\. Mission State**

**Mission имеет собственный lifecycle:**

**Recommended**

**↓**

**Accepted**

**↓**

**In Progress**

**↓**

**Completed**

**↓**

**Evaluated**

**Также:**

**Recommended → Skipped**

**Accepted → Abandoned**

---

# **18\. Recommended**

**Decision Engine определил Mission как наиболее полезную.**

**Но пользователь ещё не начал её.**

**Например:**

> **Recommended for today**

> **Practice answering behavioral interview questions.**

---

# **19\. Accepted**

**Пользователь нажал:**

> **Start Mission.**

**Mission становится текущей.**

---

# **20\. In Progress**

**Пользователь выполняет Activities внутри Mission.**

**Система сохраняет промежуточное состояние.**

**Если пользователь закрыл приложение, он может продолжить.**

---

# **21\. Completed**

**Все обязательные Activities выполнены.**

**Но здесь важно:**

> **Mission Completed ещё не означает, что Learning State изменился.**

**Сначала требуется Evaluation.**

---

# **22\. Evaluated**

**AI или другой Assessment Service обработал результаты и сформировал Evidence.**

**Только после этого система может:**

**Evidence**

**↓**

**Learning State Update**

---

# **23\. Activity State**

**Для каждой Activity:**

**Not Started**

**↓**

**In Progress**

**↓**

**Completed**

**↓**

**Evaluated**

**В некоторых случаях:**

**Not Started → Skipped**

**In Progress → Abandoned**

---

# **24\. Recommendation State**

**Recommendation является отдельным объектом.**

**Состояния:**

**Generated**

**↓**

**Shown**

**↓**

**Accepted**

**или:**

**Shown**

**↓**

**Dismissed**

**или:**

**Shown**

**↓**

**Skipped**

**Это важно для анализа поведения пользователя.**

**Мы сможем увидеть:**

> **AI рекомендовал X → пользователь постоянно игнорирует X.**

**Это может быть важным сигналом для будущей персонализации.**

---

# **25\. Evidence State**

**Evidence должно иметь состояние доверия.**

**Минимально:**

**Generated**

**↓**

**Validated**

**↓**

**Applied**

**Например:**

**Speaking assessment**

**↓**

**AI generates Evidence**

**↓**

**Evidence validated**

**↓**

**Learning State updated**

**На MVP `Validated` может означать прохождение базовых программных проверок.**

**Не требуется отдельный human reviewer.**

---

# **26\. Learning State Update**

**После Evidence система обновляет:**

**Current Estimate**

**Confidence**

**Priority**

**Evidence history**

**Last Assessed**

**Например:**

**Before:**

**Speaking A2+**

**Confidence 0.70**

**Priority High**

**Evidence:**

**3 successful interview responses**

**After:**

**Speaking A2+/B1-**

**Confidence 0.82**

**Priority High**

**Изменение не обязано происходить после каждой Activity.**

**Это важно.**

**Некоторые Activities дают:**

> **practice evidence**

**но не дают достаточно сильного Evidence для изменения состояния.**

---

# **27\. Recommendation Cycle**

**После обновления Learning State:**

**Updated State**

**↓**

**Decision Engine**

**↓**

**New Recommendation**

**Например:**

> **Speaking больше не является самым большим gap.**

**Система может переключить приоритет:**

> **Professional Vocabulary.**

**Таким образом, обучение не следует заранее заданному курсу.**

---

# **28\. Mascot State**

**Mascot имеет собственный простой lifecycle:**

**New**

**↓**

**Growing**

**↓**

**Developing**

**↓**

**Mature**

**Но его состояние не является источником истины.**

**Источник истины:**

> **Learning State \+ Evidence.**

**Mascot лишь визуализирует прогресс.**

---

# **29\. Важное ограничение Mascot**

**Не допускаем:**

> **пользователь сделал 100 бессмысленных действий → Mascot вырос.**

**Лучше:**

**Meaningful Learning Event**

**↓**

**Evidence**

**↓**

**Progress**

**↓**

**Mascot**

**Это сохраняет связь gamification с обучением.**

---

# **30\. Возврат пользователя в приложение**

**При каждом открытии приложения система должна определить:**

1. **Есть ли Active Goal?**  
2. **Есть ли актуальная Recommendation?**  
3. **Есть ли незавершённая Mission?**  
4. **Есть ли новое Evidence?**  
5. **Нужно ли обновить Learning State?**  
6. **Нужно ли пересчитать Recommendation?**

**После этого пользователь попадает на Dashboard.**

---

# **31\. Что происходит при пропуске**

**Если пользователь несколько дней не открывал приложение:**

**не создаём отдельное отрицательное состояние.**

**Не:**

> **Failed.**

**Не:**

> **Lost Progress.**

**Не:**

> **Punished.**

**Вместо этого:**

**Last Activity**

**↓**

**Current Date**

**↓**

**Remaining Time**

**↓**

**Current Learning State**

**↓**

**New Recommendation**

**Система продолжает с актуального состояния.**

---

# **32\. Что происходит при изменении Goal**

**Если Active Goal изменена существенно, существующая Learning Strategy может стать неактуальной.**

**Например:**

**Goal:**

**Pass interview**

**↓**

**Goal:**

**Study at German university**

**Система должна:**

1. **сохранить историю предыдущей Goal;**  
2. **создать новый Goal Context;**  
3. **провести необходимые дополнительные вопросы;**  
4. **пересчитать Language Requirements;**  
5. **при необходимости провести Assessment;**  
6. **создать новую Learning Strategy.**

**Не нужно удалять старое Evidence.**

---

# **33\. State Machine**

**В упрощённом виде:**

**NEW**

 **↓**

**ONBOARDING**

 **↓**

**GOAL\_SETUP**

 **↓**

**ASSESSMENT**

 **↓**

**LEARNING**

 **↙      ↘**

**PAUSED   GOAL\_COMPLETED**

  **↓            ↓**

**LEARNING   NEW\_GOAL /**

           **CONTINUOUS\_LEARNING /**

           **PAUSED**

**Внутри `LEARNING`:**

**Recommendation**

**↓**

**Mission**

**↓**

**Activities**

**↓**

**Evidence**

**↓**

**Learning State Update**

**↓**

**Recommendation**

---

# **34\. Product Decisions**

### **MVP-2.01**

**User State, Goal State, Learning State, Mission State и Activity State являются разными сущностями состояния.**

### **MVP-2.02**

**Только одна Goal может быть Active одновременно.**

### **MVP-2.03**

**Paused не уничтожает прогресс.**

### **MVP-2.04**

**Completed Goal означает достижение достаточной языковой готовности для конкретной цели, а не совершенство языка.**

### **MVP-2.05**

**Mission Completed не означает автоматически Learning State Update.**

### **MVP-2.06**

**Learning State изменяется на основании Evidence.**

### **MVP-2.07**

**Confidence является частью Learning State.**

### **MVP-2.08**

**Mascot отображает learning progress, но не определяет его.**

### **MVP-2.09**

**Пропуск обучения не приводит к потере прогресса.**

### **MVP-2.10**

**Изменение Goal может потребовать пересчёта Learning Strategy.**

### **MVP-2.11**

**State transitions должны контролироваться application logic, а не свободным ответом LLM.**

---

# **35\. Assumptions**

* **Пользователю достаточно простой модели состояний.**  
* **Пользователь понимает разницу между Goal и Mission.**  
* **Состояние `Paused` лучше, чем негативная gamification за пропуски.**  
* **Confidence повысит качество Decision Engine.**  
* **Одной Active Goal достаточно для MVP.**  
* **Пользователю не потребуется вручную управлять большинством состояний.**

---

# **36\. Risks**

### **State Complexity**

**Даже простая система может быстро получить большое количество edge cases.**

### **AI State Mutation**

**LLM может попытаться изменить состояние напрямую.**

**Это недопустимо.**

### **Goal Switching**

**Частое изменение Goal может разрушить фокус.**

### **Assessment Confidence**

**Низкое качество оценки приведёт к неправильным рекомендациям.**

### **Mascot Misalignment**

**Если XP будет слишком легко получать, Mascot потеряет смысл.**

---

# **37\. Alternatives Considered**

### **One Global User State**

**Отказались.**

**Слишком грубая модель.**

### **Mission as Main State**

**Отказались.**

**Пользователь может находиться между Missions, а Goal и Learning State существуют независимо.**

### **Automatic Goal Completion**

**Отказались.**

**Пользователь должен участвовать в решении о завершении Goal.**

### **Streak-based State**

**Отказались.**

**Не соответствует принципу:**

> **Learning Outcome \> Engagement Metric.**

### **LLM-controlled State Machine**

**Отказались.**

**Слишком непредсказуемо.**

---

# **38\. Dependencies**

**Эта глава зависит от:**

* **Goal Model;**  
* **Learning State Model;**  
* **Evidence Model;**  
* **Decision Engine;**  
* **Mission Model.**

**В будущей реализации состояния должны быть отражены в:**

* **database;**  
* **backend logic;**  
* **frontend navigation;**  
* **analytics.**

---

# **39\. Open Questions**

### **1\. Нужно ли пользователю видеть технические статусы?**

**Recommendation: нет.**

**Пользователь должен видеть понятные человеческие состояния:**

> **Getting Started**  
> **Assessing**  
> **Learning**  
> **On Hold**  
> **Goal Achieved**

**а не:**

> **`ASSESSMENT_PENDING`.**

---

### **2\. Нужно ли разрешать несколько активных Missions?**

**Recommendation: нет для MVP.**

**Одна текущая Mission уменьшает когнитивную нагрузку и сильно упрощает систему.**

---

### **3\. Нужно ли позволять вручную выбирать Mission?**

**Recommendation: да, но не делать это основным UX.**

**Основной путь:**

> **Recommendation → Start.**

**Но пользователь может выбрать альтернативу.**

---

# **40\. Acceptance Criteria**

**Глава считается завершённой, если:**

* **определены основные User States;**  
* **определены Goal States;**  
* **определены Mission States;**  
* **определены Activity States;**  
* **определена логика Evidence;**  
* **определена связь Evidence → Learning State;**  
* **определена логика Recommendation;**  
* **определена логика Mascot;**  
* **определены основные переходы;**  
* **LLM не управляет State Machine напрямую;**  
* **пропуск не уничтожает прогресс;**  
* **смена Goal имеет определённое поведение.**

---

# **41\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Decision Before Generation** | **✅** |
| **Continuous Adaptation** | **✅** |
| **User Agency** | **✅** |
| **AI as Execution Layer** | **✅** |
| **MVP Simplicity** | **✅** |
| **Buildable by Founder \+ AI** | **✅** |
| **Mascot tied to learning** | **✅** |
| **No Life Management** | **✅** |
| **iOS-first compatibility** | **✅** |

---

## **Итог**

**Мы зафиксировали state machine MVP — набор состояний, через которые проходит пользователь и его обучение.**

**Это особенно важно для разработки через AI: теперь мы можем сказать AI не просто:**

> **«Сделай экран Mission»,**

**а:**

> **«Если Mission имеет статус `Recommended`, пользователь может начать её. После старта статус становится `In Progress`. После выполнения Activities — `Completed`. Только после Evaluation создаётся Evidence, которое может изменить Learning State».**

**Это сильно уменьшает вероятность того, что AI построит хаотичное приложение.**

# **I. PRODUCT SYSTEM**

# **3\. MVP Information Architecture**

## **1\. Цель**

**Определить структуру iOS-приложения на уровне основных разделов, экранов и переходов.**

**Задача MVP Information Architecture — не создать большое приложение с множеством разделов, а сделать так, чтобы пользователь в любой момент понимал, где он находится и что делать дальше.**

**Главный принцип:**

> **Dashboard → Recommendation → Mission → Evidence → Next Recommendation**

---

## **2\. Контекст**

**В MVP существует одна центральная пользовательская сущность:**

> **Active Goal**

**Все основные части приложения должны работать вокруг неё.**

**Пользователь не должен самостоятельно искать:**

* **что учить;**  
* **какой материал открыть;**  
* **какое упражнение выбрать;**  
* **какой урок пройти.**

**LOS должен показывать наиболее полезное следующее действие.**

---

# **3\. Основная структура приложения**

**Предлагаю для MVP 4 основных раздела:**

**App**

**│**

**├── Home**

**│**

**├── Goal**

**│**

**├── Library**

**│**

**└── Profile**

**При этом Mission не является отдельным постоянным разделом.**

**Она открывается из Home / Recommendation и существует как отдельный learning flow.**

---

# **4\. Home**

**Home — главный экран приложения.**

**Это не статистический Dashboard.**

**Это:**

> **операционный центр Active Goal.**

**Home должен отвечать на вопросы:**

1. **К чему я сейчас иду?**  
2. **Насколько я близок?**  
3. **Что мне делать сейчас?**  
4. **Почему именно это?**  
5. **Что происходит с моим Mascot?**

---

## **4.1 Home Structure**

**Предлагаемая структура:**

**Home**

**│**

**├── Mascot**

**│**

**├── Active Goal**

**│**

**├── Goal Progress / Readiness**

**│**

**├── Today's Recommendation**

**│**

**├── Why this?**

**│**

**└── Quick access**

---

# **5\. Mascot**

**Mascot занимает заметное место в верхней части Home.**

**Например:**

       **🐣**

   **"You're growing\!"**

   

**Interview Goal**

**42% Ready**

**Today's Mission**

**Practice speaking**

**Но конкретный дизайн будет определяться в следующей главе — MVP Screen Specification.**

**Здесь фиксируем только информационную роль.**

**Mascot показывает:**

> **визуализированный прогресс обучения.**

**Он не должен показывать прогресс жизненной цели.**

---

# **6\. Active Goal**

**На Home отображается:**

* **название Goal;**  
* **target language;**  
* **Deadline;**  
* **текущая готовность.**

**Например:**

> **Pass my English interview**  
> **94 days left**

---

# **7\. Goal Readiness**

**Для MVP используем упрощённую модель.**

**Не показываем псевдоточное:**

> **63.72%**

**Предпочтительнее:**

> **Getting Ready**

**или:**

> **Almost Ready**

**или:**

> **Ready**

**При необходимости можно дополнительно показывать progress visualization.**

---

# **8\. Recommendation**

**Это главный CTA Home.**

**Например:**

> ### **Today's Mission**

> **Practice answering behavioral interview questions.**

**Кнопка:**

> **Start Mission**

---

# **9\. Why This?**

**Рядом с Recommendation должна быть возможность увидеть объяснение:**

> **Why this?**

**Например:**

> **Your speaking is currently the biggest gap for your interview goal.**

**Это реализует принцип:**

> **Explainable Intelligence.**

---

# **10\. Goal**

**Второй постоянный раздел:**

> **Goal**

**Он показывает более подробную информацию об Active Goal.**

**Структура:**

**Goal**

**│**

**├── Goal Overview**

**├── Deadline**

**├── Available Time**

**├── Language Outcomes**

**├── Readiness**

**├── Current Priorities**

**└── Goal Settings**

---

# **11\. Goal Overview**

**Пользователь видит:**

> **Что именно я хочу достичь.**

**Например:**

**Pass an English interview for a Project Manager role.**

**Если Goal была сформулирована слишком общо, пользователь может уточнить её.**

---

# **12\. Deadline & Available Time**

**Пользователь может изменить:**

* **Deadline;**  
* **Available Time.**

**Изменение этих параметров должно запускать пересмотр Learning Strategy.**

**Например:**

> **«Я теперь могу заниматься 30 минут вместо 15».**

**Система может ответить:**

> **Your learning strategy has been adjusted.**

---

# **13\. Language Outcomes**

**Здесь пользователь может увидеть, что именно ему необходимо уметь на языке для достижения Goal.**

**Например:**

### **Interview Communication**

* **describe experience;**  
* **explain projects;**  
* **answer behavioral questions;**  
* **ask questions;**  
* **understand interviewer questions.**

**Это важный момент.**

**Мы показываем языковые результаты, а не жизненные задачи.**

---

# **14\. Current Priorities**

**Goal может показать:**

> **Your current priorities**

**Например:**

1. **Interview Speaking**  
2. **Professional Vocabulary**  
3. **Listening**

**Это помогает пользователю понимать:**

> **почему система предлагает именно такие Missions.**

---

# **15\. Library**

**Третий постоянный раздел:**

> **Library**

**Он содержит доступные пользователю образовательные ресурсы.**

**Но Library не должна становиться центром продукта.**

---

# **16\. Library Structure**

**В MVP:**

**Library**

**│**

**├── For Your Goal**

**├── Public Resources**

**└── My Materials**

---

## **16.1 For Your Goal**

**Система показывает материалы, которые считает релевантными текущей Goal.**

**Например:**

> **Interview English**  
> **Business communication**  
> **Behavioral interview vocabulary**

**Это не список случайного контента.**

---

## **16.2 Public Resources**

**Каталог качественных бесплатных ресурсов.**

**Материалы должны быть:**

* **легально доступными;**  
* **appropriately licensed;**  
* **public domain;**  
* **либо представленными через ссылку на источник.**

---

## **16.3 My Materials**

**Пользователь может добавлять:**

* **PDF;**  
* **ссылки;**  
* **изображения;**  
* **текст;**  
* **собственные заметки.**

**В MVP не требуется сложная система организации материалов.**

---

# **17\. Profile**

**Четвёртый раздел:**

> **Profile**

**Он содержит настройки пользователя.**

**Минимально:**

**Profile**

**│**

**├── Target Languages**

**├── Learning Preferences**

**├── Notifications**

**├── Account**

**└── Settings**

---

# **18\. Goal Management**

**У пользователя может быть несколько Goals.**

**Но в MVP управление ими не должно занимать центральное место.**

**Например:**

**My Goals**

**● English Interview       Active**

**○ German Relocation       Paused**

**○ Spanish Travel          Completed**

**Только одна Goal:**

> **Active.**

---

# **19\. Mission Flow**

**Mission не является пунктом главной навигации.**

**Пользователь попадает в Mission через:**

**Home**

**↓**

**Recommendation**

**↓**

**Mission**

**После завершения:**

**Mission**

**↓**

**Evidence / Feedback**

**↓**

**Learning State**

**↓**

**Next Recommendation**

---

# **20\. Activity Flow**

**Mission содержит Activities.**

**Например:**

**Mission**

**│**

**├── Activity 1**

**├── Activity 2**

**├── Activity 3**

**└── Final Practice**

**Пользователь не должен видеть сложную структуру курса.**

**Activities воспринимаются как последовательность действий внутри одной Mission.**

---

# **21\. После Activity**

**После отдельной Activity пользователь обычно остаётся внутри Mission.**

**Например:**

**Speaking Activity**

**↓**

**Feedback**

**↓**

**Try Again**

**↓**

**Next Activity**

**Не возвращаем пользователя на Dashboard после каждого небольшого действия.**

**Это уменьшает friction.**

---

# **22\. После Mission**

**После завершения Mission показываем:**

### **Result**

**Что произошло.**

### **Feedback**

**Что получилось.**

### **Evidence**

**Что система узнала о навыке.**

### **Progress**

**Что изменилось.**

### **Next Recommendation**

**Что делать дальше.**

**Например:**

> **You improved your interview speaking.**

> **Your vocabulary is now the biggest gap.**

> **Next: Practice professional vocabulary.**

---

# **23\. Navigation Model**

**Для iOS MVP предлагаю использовать Tab Bar:**

**┌─────────────────────────────────┐**

**│                                 │**

**│          Current Screen         │**

**│                                 │**

**│                                 │**

**├─────────────────────────────────┤**

**│  Home   Goal   Library   Profile│**

**└─────────────────────────────────┘**

**Это стандартная iOS-модель, понятная пользователю.**

---

# **24\. Почему не делать Mission отдельной вкладкой**

**Потому что Mission — это не постоянное место назначения.**

**Это:**

> **следующее действие в Learning Loop.**

**Если сделать отдельную вкладку `Missions`, пользователь может начать воспринимать приложение как:**

> **библиотеку заданий.**

**Это противоречит LOS.**

---

# **25\. Почему Library не должна быть первой вкладкой**

**Если пользователь видит:**

> **Home | Library | Goals | Profile**

**и Library занимает центральное место, продукт легко начинает восприниматься как:**

> **контентная платформа.**

**Мы хотим обратное:**

> **Goal → Decision → Mission.**

**Поэтому Home является центром продукта.**

---

# **26\. First Launch Flow**

**При первом запуске:**

**Launch**

**↓**

**Welcome**

**↓**

**Target Language**

**↓**

**Goal**

**↓**

**Deadline**

**↓**

**Available Time**

**↓**

**Goal Analysis**

**↓**

**Feasibility**

**↓**

**Goal Confirmation**

**↓**

**Assessment**

**↓**

**Learning Strategy**

**↓**

**Home**

**После первого завершения onboarding пользователь должен попасть сразу на Home с первой Recommendation.**

---

# **27\. Returning User Flow**

**Для существующего пользователя:**

**Launch**

**↓**

**Home**

**↓**

**Current Recommendation**

**↓**

**Mission**

**Никакого повторного onboarding.**

---

# **28\. Empty States**

**Мы должны заранее определить состояния, когда данных ещё нет.**

### **No Goal**

> **What do you want to achieve?**

**CTA:**

> **Create Goal**

### **No Assessment**

> **Let's discover where you are now.**

**CTA:**

> **Start Assessment**

### **No Recommendation**

**Это не должно быть нормальным состоянием.**

**Если Decision Engine не может создать Recommendation, система должна показать fallback.**

**Например:**

> **Review your current skills.**

---

# **29\. Error States**

**AI не всегда будет работать.**

**Поэтому пользователь не должен видеть:**

> **`LLM Error 500`**

**Вместо этого:**

> **Something went wrong.**

**и:**

> **Try again.**

**Если ошибка повторяется:**

> **Continue with another available activity.**

**Это особенно важно для AI-first продукта.**

---

# **30\. iOS-specific Principle**

**Поскольку мы приняли iOS-first, навигация и интерфейс должны использовать стандартные iOS patterns:**

* **Tab Bar;**  
* **Navigation Stack;**  
* **Sheets;**  
* **native forms;**  
* **native permissions;**  
* **стандартные gesture patterns.**

**Не нужно создавать собственную сложную navigation system.**

---

# **31\. Product Decisions**

### **MVP-3.01**

**MVP имеет четыре основных раздела: Home, Goal, Library, Profile.**

### **MVP-3.02**

**Home является центральным интерфейсом Learning Operating System.**

### **MVP-3.03**

**Mission не является постоянной вкладкой.**

### **MVP-3.04**

**Основной путь пользователя: Home → Recommendation → Mission.**

### **MVP-3.05**

**Library является ресурсом, а не центром продукта.**

### **MVP-3.06**

**Goal отображает языковые outcomes, а не жизненные задачи.**

### **MVP-3.07**

**Home показывает причину Recommendation.**

### **MVP-3.08**

**Пользователь имеет одну Active Goal.**

### **MVP-3.09**

**iOS MVP использует стандартную tab-based navigation.**

### **MVP-3.10**

**После завершения Mission пользователь получает Feedback \+ Evidence \+ Next Recommendation.**

---

# **32\. Assumptions**

* **Четырёх основных разделов достаточно для MVP.**  
* **Пользователь будет воспринимать Home как главный рабочий экран.**  
* **Mission лучше воспринимается как flow, а не как отдельный раздел.**  
* **Library не должна быть основным способом навигации.**  
* **Пользователь будет понимать языковые outcomes, если они сформулированы простым языком.**

---

# **33\. Risks**

### **Navigation Overload**

**Даже четыре вкладки могут оказаться избыточными, если некоторые функции лучше сделать контекстными.**

### **Library Drift**

**Пользователь может начать использовать приложение исключительно как библиотеку.**

### **Goal Complexity**

**Сложные Goals могут создавать слишком много информации на Goal screen.**

### **Recommendation Visibility**

**Если Recommendation недостаточно заметна, пользователь будет самостоятельно искать контент.**

---

# **34\. Alternatives Considered**

### **3 Tabs**

**Home / Library / Profile.**

**Отвергнуто на текущем этапе, потому что Goal заслуживает отдельного пространства.**

### **5+ Tabs**

**Отвергнуто из\-за лишней сложности.**

### **Missions Tab**

**Отвергнуто, поскольку противоречит decision-driven модели.**

### **Library-first**

**Отвергнуто, поскольку превращает продукт в content platform.**

### **Chat-first Navigation**

**Отвергнуто, поскольку превращает LOS в AI chat application.**

---

# **35\. Dependencies**

**Зависит от:**

* **User States;**  
* **Goal Model;**  
* **Learning State;**  
* **Recommendation;**  
* **Mission;**  
* **Knowledge Library.**

**Влияет на:**

* **Screen Specification;**  
* **Data Model;**  
* **Technical Architecture;**  
* **Analytics.**

---

# **36\. Open Questions**

### **1\. Нужно ли отображать Learning State отдельной вкладкой?**

**Recommendation: нет в MVP.**

**Он должен быть встроен в Goal и Home.**

**Пользователю важнее понимать:**

> **«Что мне делать?»**

**чем видеть техническую карту своих навыков.**

---

### **2\. Нужен ли отдельный Progress tab?**

**Recommendation: нет.**

**Progress должен быть частью Home \+ Goal.**

**Отдельный Progress tab создаёт риск превращения продукта в приложение для просмотра статистики.**

---

### **3\. Нужен ли отдельный Chat tab?**

**Recommendation: категорически нет для MVP.**

**AI conversation — это Activity type.**

**Это важное архитектурное решение.**

---

# **37\. Acceptance Criteria**

* **Определена главная навигация.**  
* **Определены основные разделы.**  
* **Home является центром LOS.**  
* **Goal имеет отдельный экран.**  
* **Library отделена от learning loop.**  
* **Profile содержит настройки.**  
* **Mission не является постоянной вкладкой.**  
* **Определён первый пользовательский flow.**  
* **Определён returning user flow.**  
* **Определены основные empty states.**  
* **Определены базовые error states.**  
* **Навигация совместима с iOS.**  
* **Архитектура не превращает приложение в content library или chat.**

---

# **38\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Decision Before Generation** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Continuous Adaptation** | **✅** |
| **User Agency** | **✅** |
| **Home as LOS interface** | **✅** |
| **Mission as learning unit** | **✅** |
| **Library as resource** | **✅** |
| **Chat is not the product** | **✅** |
| **iOS-first** | **✅** |
| **Founder \+ AI buildability** | **✅** |

---

## **Итог**

**Мы сознательно делаем очень маленькую информационную архитектуру:**

            **┌─────────────┐**

             **│    HOME     │**

             **│  LOS Center │**

             **└──────┬──────┘**

                    **│**

             **Recommendation**

                    **│**

                    **▼**

                **MISSION**

                    **│**

                **Activities**

                    **│**

                 **Evidence**

                    **│**

                    **▼**

             **Next Recommendation**

**HOME ─── GOAL**

  **│**

  **├──── LIBRARY**

  **│**

  **└──── PROFILE**

**Главное решение здесь:**

> **Мы не строим приложение вокруг экранов. Мы строим экраны вокруг Learning Loop.**

# **I. PRODUCT SYSTEM**

# **4\. MVP Screen Specification**

## **1\. Цель**

**Определить конкретный набор экранов MVP, их назначение, содержимое, действия пользователя и переходы между ними.**

**Эта глава переводит Information Architecture в спецификацию, которую можно непосредственно использовать при разработке iOS-приложения через AI coding tools.**

**Главный принцип:**

> **Каждый экран должен иметь одну основную пользовательскую задачу.**

**Мы не создаём экраны ради отображения данных.**

---

# **2\. Контекст**

**В предыдущей главе зафиксирована структура:**

**Home**

**Goal**

**Library**

**Profile**

**Основной learning flow:**

**Home**

**↓**

**Recommendation**

**↓**

**Mission**

**↓**

**Activities**

**↓**

**Evidence**

**↓**

**Learning State Update**

**↓**

**Next Recommendation**

**MVP должен содержать только те экраны, которые необходимы для этого цикла.**

---

# **3\. MVP Screen Map**

**Предлагаю следующий минимальный набор:**

**ONBOARDING**

**1\. Welcome**

**2\. Target Language**

**3\. Goal Setup**

**4\. Goal Analysis**

**5\. Goal Confirmation**

**6\. Initial Assessment**

**7\. Assessment Result**

**8\. Learning Strategy**

**MAIN APP**

**9\. Home**

**10\. Goal**

**11\. Library**

**12\. Profile**

**LEARNING**

**13\. Mission Overview**

**14\. Activity**

**15\. Activity Feedback**

**16\. Mission Result**

**SYSTEM**

**17\. Add Material**

**18\. Settings**

**19\. Error / Recovery**

**Итого: 19 экранов / screen states.**

**Это не означает, что мы создаём 19 сложных уникальных UI-компонентов.**

**Многие будут простыми состояниями существующих экранов.**

---

# **4\. Screen 01 — Welcome**

## **Цель**

**Объяснить пользователю ценность приложения и начать onboarding.**

### **Содержимое**

* **Mascot;**  
* **короткое value proposition;**  
* **CTA.**

**Пример:**

> **Tell us what you want to achieve.**  
> **We'll help you learn the language for it.**

**CTA:**

> **Get Started**

### **Не показываем**

* **статистику;**  
* **библиотеку;**  
* **AI chat;**  
* **длинное описание продукта.**

---

# **5\. Screen 02 — Target Language**

## **Цель**

**Определить изучаемый язык.**

### **UI**

**Список / поиск языков.**

**Например:**

* **English;**  
* **German;**  
* **Spanish;**  
* **French.**

### **MVP**

**Количество языков может быть ограничено.**

**Не нужно технически поддерживать десятки языков до проверки продукта.**

### **CTA**

> **Continue**

---

# **6\. Screen 03 — Goal Setup**

## **Цель**

**Получить первичную формулировку Goal.**

### **Пользователь вводит**

> **What do you want to achieve?**

**Свободный текст допустим.**

**Пример:**

> **I want to get a job in Germany.**

**Дополнительно:**

* **Deadline;**  
* **Available Time.**

### **UX-принцип**

**Не заставлять пользователя проходить длинный questionnaire.**

---

# **7\. Screen 04 — Goal Analysis**

## **Цель**

**Показать, что система превратила пользовательскую формулировку в языковую цель.**

**Например:**

> **Your goal**

> **Get ready for job interviews in German.**

### **System identifies**

* **target situations;**  
* **language outcomes;**  
* **required skills.**

**Пользователь может изменить интерпретацию.**

---

# **8\. Screen 05 — Goal Confirmation**

**Пользователь подтверждает:**

> **This is what I want to achieve.**

**Показываем:**

* **Goal;**  
* **Deadline;**  
* **Available Time;**  
* **Language Outcomes.**

**CTA:**

> **Looks right**

**Вторичная возможность:**

> **Edit**

**После подтверждения Goal получает статус:**

> **Active.**

---

# **9\. Screen 06 — Initial Assessment**

## **Цель**

**Определить начальное состояние пользователя.**

**Assessment должен ощущаться не как экзамен.**

**Например:**

> **Let's see where you are now.**

### **Возможные Activity Types**

* **vocabulary;**  
* **reading;**  
* **listening;**  
* **speaking;**  
* **writing.**

**Для MVP assessment должен быть коротким.**

---

# **10\. Screen 07 — Assessment Result**

**Пользователь получает не длинный отчёт, а понятное объяснение:**

> **Here's where you are now.**

**Например:**

### **Stronger**

**Listening**

### **Needs Work**

**Speaking**

### **Priority**

**Interview vocabulary**

---

# **11\. Screen 08 — Learning Strategy**

**Показываем, как система предлагает двигаться к Goal.**

**Например:**

> **Your learning path**

1. **Build interview vocabulary.**  
2. **Practice answering questions.**  
3. **Improve listening comprehension.**  
4. **Simulate interviews.**

**Это не фиксированный курс.**

**Важно явно показать:**

> **Your plan will adapt as you learn.**

**CTA:**

> **Start Learning**

---

# **12\. Screen 09 — Home**

**Это главный экран приложения.**

### **Основная структура**

**Mascot**

**Your Goal**

**──────────────**

**Pass my German interview**

**94 days left**

**Your progress**

**Getting Ready**

**Today's Mission**

**──────────────**

**Practice interview answers**

**Why this?**

**Your speaking is currently**

**your biggest gap.**

**\[ Start Mission \]**

---

# **13\. Home — Mascot**

**Mascot занимает верхнюю визуальную область.**

**Он:**

* **растёт;**  
* **меняется;**  
* **реагирует на meaningful progress;**  
* **отражает learning journey.**

**Но не занимает весь экран.**

**Продукт:**

> **learning app with a mascot**

**а не:**

> **mascot game with language learning.**

---

# **14\. Home — Goal**

**Показываем:**

* **Goal;**  
* **Deadline;**  
* **readiness.**

**Не перегружаем техническими показателями.**

---

# **15\. Home — Recommendation**

**Это главный CTA.**

**В каждый момент система должна стремиться дать:**

> **One best next action.**

**Например:**

> **Practice answering “Tell me about yourself.”**

**Кнопка:**

> **Start**

---

# **16\. Home — Why?**

**Пользователь может открыть explanation.**

**Например:**

> **We recommend this because your speaking performance is currently the biggest gap for your goal.**

**Это важная часть доверия к LOS.**

---

# **17\. Screen 10 — Goal**

### **Структура**

**Goal**

**Pass my German interview**

**Deadline**

**November 14**

**Available time**

**20 min/day**

**Readiness**

**Getting Ready**

**What you need to do in German**

**─────────────────────────────**

**Interview communication**

**Professional vocabulary**

**Listening**

**Current priorities**

**───────────────────**

**Speaking**

**Vocabulary**

**Listening**

**\[ Edit Goal \]**

---

# **18\. Screen 11 — Library**

**Library состоит из:**

### **For Your Goal**

**Материалы, релевантные Active Goal.**

### **Public Resources**

**Бесплатные внешние ресурсы.**

### **My Materials**

**Пользовательские материалы.**

---

# **19\. Library Principle**

**Library не должна показывать бесконечный feed.**

**Не:**

> **5000 materials.**

**А:**

> **Here are the resources most useful for your current goal.**

---

# **20\. Screen 12 — Profile**

**Минимально:**

* **account;**  
* **languages;**  
* **learning preferences;**  
* **notifications;**  
* **privacy;**  
* **subscription;**  
* **help.**

**Не превращаем Profile в отдельную систему управления обучением.**

---

# **21\. Screen 13 — Mission Overview**

**Пользователь открывает Recommendation.**

**Экран показывает:**

> **Mission: Interview Answers**

### **Purpose**

> **Practice answering common interview questions.**

### **Why**

> **Speaking is currently your biggest gap.**

### **Estimated time**

> **12 min**

### **Activities**

**3 activities.**

**CTA:**

> **Start Mission**

---

# **22\. Screen 14 — Activity**

**Это основной learning screen.**

**Тип Activity зависит от задания.**

**Например:**

### **Speaking**

> **Tell me about your previous project.**

**\[🎙 Record\]**

**или:**

### **Vocabulary**

> **Choose the best word.**

**или:**

### **Reading**

> **Read the text and answer.**

**Важно:**

> **Activity — это универсальная оболочка.**

**Тип задания может быть разным.**

---

# **23\. Screen 15 — Activity Feedback**

**После выполнения:**

> **Here's how you did.**

**Например:**

### **What went well**

**You explained your experience clearly.**

### **Improve**

**Try using more specific vocabulary.**

### **Example**

> **“I led a team of five…”**

**CTA:**

> **Continue**

---

# **24\. Screen 16 — Mission Result**

**После завершения Mission:**

> **Mission complete**

**Но основной акцент не на gamification.**

**Показываем:**

### **You practiced**

**Interview speaking**

### **We learned**

**You can explain previous experience confidently.**

### **Still needs work**

**Professional vocabulary.**

### **Mascot**

**Получает meaningful progress.**

**CTA:**

> **See what's next**

---

# **25\. Screen 17 — Add Material**

**Пользователь может добавить:**

* **PDF;**  
* **image;**  
* **text;**  
* **URL.**

**Минимальный flow:**

**Add Material**

**↓**

**Select Type**

**↓**

**Upload / Paste**

**↓**

**Processing**

**↓**

**Available in Library**

**В MVP не нужно создавать сложный редактор документов.**

---

# **26\. Screen 18 — Settings**

**Settings содержит:**

* **notifications;**  
* **language;**  
* **account;**  
* **privacy;**  
* **subscription;**  
* **data management.**

---

# **27\. Screen 19 — Error / Recovery**

**AI-продукт обязательно должен иметь graceful failure.**

**Пример:**

> **Something went wrong.**

**CTA:**

> **Try Again**

**Secondary:**

> **Continue with another activity**

**Пользователь никогда не должен видеть технические ошибки API / LLM.**

---

# **28\. Universal UI Principle**

**Каждый экран должен иметь:**

### **Primary Action**

**Одно главное действие.**

### **Secondary Action**

**Если необходимо.**

### **Context**

**Почему пользователь здесь.**

### **Exit**

**Понятный способ вернуться назад.**

---

# **29\. Loading States**

**AI-запросы могут занимать время.**

**Нельзя просто показывать бесконечный spinner.**

**Вместо этого:**

> **Analyzing your goal…**

> **Checking your answers…**

> **Building your next mission…**

**Это делает AI-процесс понятнее.**

**Но сообщения не должны создавать ложное впечатление о действиях, которых система фактически не выполняет.**

---

# **30\. Empty States**

**Каждый экран должен иметь понятное состояние отсутствия данных.**

**Например Library:**

> **Your library is empty.**

> **Add a material or explore public resources.**

---

# **31\. Offline / Network State**

**Для MVP не нужно делать полноценный offline learning.**

**Но пользователь должен корректно увидеть:**

> **No internet connection**

**и получить возможность повторить действие.**

---

# **32\. Accessibility**

**Для iOS MVP необходимо сразу учитывать:**

* **Dynamic Type;**  
* **VoiceOver compatibility;**  
* **sufficient tap targets;**  
* **readable contrast;**  
* **captions / text alternatives for audio;**  
* **отсутствие зависимости только от цвета.**

**Не откладываем accessibility полностью на post-MVP, потому что исправлять её позднее дороже.**

---

# **33\. Screen State vs Screen**

**Важное архитектурное решение:**

> **Не каждая вариация UI должна становиться отдельным экраном.**

**Например:**

**Activity**

**├── Loading**

**├── Ready**

**├── In Progress**

**├── Submitted**

**├── Feedback**

**└── Error**

**Это один Activity flow с разными состояниями.**

**Это значительно упрощает разработку.**

---

# **34\. MVP UI Principle**

**Не строить сложный дизайн-системный фреймворк заранее.**

**В MVP достаточно:**

* **базовой typography;**  
* **spacing;**  
* **buttons;**  
* **cards;**  
* **navigation;**  
* **inputs;**  
* **progress indicators;**  
* **mascot component.**

**Design System можно расширить после первых пользовательских тестов.**

---

# **35\. Product Decisions**

### **MVP-4.01**

**MVP состоит из 19 основных screen / screen states.**

### **MVP-4.02**

**Home является главным экраном.**

### **MVP-4.03**

**Каждый экран имеет одно главное действие.**

### **MVP-4.04**

**Mission является flow, а не постоянным разделом.**

### **MVP-4.05**

**Activity является универсальной оболочкой для разных типов упражнений.**

### **MVP-4.06**

**Feedback является обязательной частью learning loop.**

### **MVP-4.07**

**Mission Result показывает Evidence и изменения в обучении, а не только XP.**

### **MVP-4.08**

**Mascot присутствует на Home и получает прогресс из meaningful learning events.**

### **MVP-4.09**

**AI loading states должны объяснять происходящий процесс.**

### **MVP-4.10**

**Ошибки AI/API не показываются пользователю в техническом виде.**

### **MVP-4.11**

**iOS accessibility учитывается уже в MVP.**

### **MVP-4.12**

**Screen states не должны без необходимости превращаться в отдельные экраны.**

---

# **36\. Assumptions**

* **Пользователю достаточно одного главного CTA на экране.**  
* **Home сможет стать основным местом возвращения пользователя.**  
* **Короткий onboarding будет конвертировать лучше длинного.**  
* **Пользователю полезнее видеть понятные результаты, чем техническую статистику.**  
* **Универсальная Activity architecture позволит быстро добавлять новые типы упражнений.**

---

# **37\. Risks**

### **Too Many Screens**

**19 screen states — верхняя граница для текущего MVP. Необходимо избегать дальнейшего разрастания.**

### **Onboarding Drop-off**

**Goal Analysis \+ Assessment могут стать слишком длинными.**

### **AI Latency**

**Долгие AI-запросы могут ухудшить UX.**

### **Information Density**

**Goal и Home легко перегрузить.**

### **Mascot Dominance**

**Маскот может начать конкурировать с основным learning CTA.**

---

# **38\. Alternatives Considered**

### **Dashboard \+ Chat**

**Отвергнуто.**

**Chat не является главным интерфейсом LOS.**

### **Library-first**

**Отвергнуто.**

**Не соответствует Goal-first архитектуре.**

### **Separate Progress Screen**

**Отложено.**

**В MVP Progress встроен в Home и Goal.**

### **Separate Mission Tab**

**Отвергнуто.**

**Mission является частью Learning Loop.**

### **Fully Dynamic UI Generated by AI**

**Отвергнуто.**

**AI может генерировать контент, но не должен свободно генерировать структуру приложения.**

---

# **39\. Dependencies**

**Зависит от:**

* **Core User States;**  
* **Information Architecture;**  
* **Goal Model;**  
* **Learning State;**  
* **Evidence;**  
* **Mission;**  
* **Activity System.**

**Влияет на:**

* **iOS implementation;**  
* **Data Model;**  
* **AI services;**  
* **Analytics;**  
* **Technical Architecture.**

---

# **40\. Open Questions**

### **1\. Нужен ли onboarding через несколько экранов или один длинный?**

**Recommendation: несколько коротких экранов.**

**Это лучше соответствует iOS UX и позволяет адаптировать вопросы.**

### **2\. Нужно ли показывать полный Learning Strategy пользователю?**

**Recommendation: да, но кратко.**

**Пользователь должен понимать направление, но не видеть внутреннюю сложность LOS.**

### **3\. Нужно ли показывать numerical progress?**

**Recommendation: не делать его главным показателем.**

**Можно использовать его после пользовательского тестирования, если он действительно помогает.**

---

# **41\. Acceptance Criteria**

* **Все MVP screen states определены.**  
* **Для каждого экрана определена основная задача.**  
* **Определены primary actions.**  
* **Определены основные transitions.**  
* **Определены loading states.**  
* **Определены empty states.**  
* **Определены error states.**  
* **Mission flow определён.**  
* **Activity flow определён.**  
* **Feedback flow определён.**  
* **Mascot встроен в Home.**  
* **Library не конкурирует с Learning Loop.**  
* **Screen architecture пригодна для AI-assisted development.**  
* **iOS patterns учитываются.**

---

# **42\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Decision Before Generation** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Continuous Adaptation** | **✅** |
| **User Agency** | **✅** |
| **Home as LOS interface** | **✅** |
| **Mission as learning flow** | **✅** |
| **Library as resource** | **✅** |
| **AI as execution layer** | **✅** |
| **iOS-first** | **✅** |
| **Founder \+ AI buildability** | **✅** |

---

## **Итог**

**У нас теперь есть связка:**

**1\. User Flow**

       **↓**

**2\. User States**

       **↓**

**3\. Information Architecture**

       **↓**

**4\. Screen Specification**

# **II. LEARNING & AI**

# **5\. MVP Learning Model**

## **1\. Цель**

**Определить минимальную образовательную модель MVP:**

> **что именно система считает обучением, какие языковые способности отслеживает и как жизненная Goal превращается в конкретные языковые требования.**

**Главная задача — не создать идеальную модель языка.**

**Задача MVP — создать достаточно хорошую модель, чтобы LOS мог принимать полезные решения:**

> **«Что этому пользователю полезнее всего делать сейчас?»**

---

# **2\. Контекст**

**Фундаментальная логика продукта:**

**Life Goal**

**↓**

**Language Goal**

**↓**

**Language Outcomes**

**↓**

**Situations**

**↓**

**Skills**

**↓**

**Knowledge**

**↓**

**Activities**

**↓**

**Evidence**

**↓**

**Learning State**

**↓**

**Recommendation**

**При этом приложение не должно учить пользователя решать его жизненные задачи.**

**Например:**

**Life Goal**

> **Get a job in Germany.**

**не превращается в:**

> **Find jobs in Germany.**

**Она превращается в:**

> **German skills needed for professional interviews.**

---

# **3\. Главный принцип Learning Model**

**Мы не строим обучение вокруг:**

* **учебников;**  
* **уроков;**  
* **грамматических тем;**  
* **списков слов;**  
* **отдельных упражнений.**

**Мы строим его вокруг:**

> **способностей пользователя выполнять языковые действия в релевантных ситуациях.**

**Например:**

**Не:**

> **изучить Past Simple.**

**А:**

> **уметь рассказать о предыдущем опыте.**

**Грамматика, vocabulary, pronunciation и другие знания становятся средствами развития этой способности.**

---

# **4\. Life Goal → Language Goal**

**Пользователь вводит:**

> **«Хочу работать в Германии».**

**Система должна преобразовать это в:**

### **Language Goal**

> **Communicate effectively in German in professional situations relevant to employment.**

**Но эта формулировка слишком общая для обучения.**

**Поэтому следующий уровень:**

### **Language Outcomes**

**Пользователь должен уметь:**

* **понимать типичные вопросы;**  
* **рассказывать о своём опыте;**  
* **описывать профессиональные задачи;**  
* **задавать уточняющие вопросы;**  
* **использовать релевантную профессиональную лексику.**

---

# **5\. Language Situations**

**Language Outcomes привязываются к конкретным ситуациям.**

**Например:**

**Professional Communication**

**│**

**├── Interview**

**│   ├── Introduction**

**│   ├── Experience**

**│   ├── Responsibilities**

**│   ├── Behavioral Questions**

**│   └── Questions to Interviewer**

**│**

**├── Workplace Communication**

**│   ├── Meetings**

**│   ├── Email**

**│   ├── Clarification**

**│   └── Small Talk**

**В MVP не требуется заранее создать огромную библиотеку ситуаций.**

**Они могут формироваться AI на основе Goal.**

---

# **6\. Skills**

**Для MVP используем понятие:**

> **Skill**

**Skill — это наблюдаемая языковая способность.**

**Например:**

### **Speaking**

> **Explain previous work experience.**

### **Listening**

> **Understand common interview questions.**

### **Writing**

> **Write a short professional email.**

### **Reading**

> **Understand a job-related text.**

### **Vocabulary**

> **Use relevant professional vocabulary.**

---

# **7\. Skill Dimensions**

**Базовые языковые направления MVP:**

**Speaking**

**Listening**

**Reading**

**Writing**

**Vocabulary**

**Grammar**

**Pronunciation**

**Но они не являются равноправными обязательными целями для каждого пользователя.**

**Decision Engine выбирает релевантные Skills на основании Goal.**

**Например:**

**для interview:**

> **Speaking ↑**  
> **Listening ↑**  
> **Vocabulary ↑**

**для reading academic papers:**

> **Reading ↑**  
> **Vocabulary ↑**  
> **Grammar ↑**

---

# **8\. Почему нельзя строить модель только вокруг четырёх навыков**

**Классическая модель:**

> **Reading / Writing / Listening / Speaking**

**слишком грубая для LOS.**

**Например два пользователя могут иметь одинаковый Speaking level, но:**

* **один хорошо рассказывает истории;**  
* **другой умеет вести переговоры;**  
* **третий умеет проходить интервью.**

**Поэтому в MVP мы используем иерархию:**

**Language Domain**

**↓**

**Skill**

**↓**

**Skill Instance / Context**

**Например:**

**Speaking**

**↓**

**Professional Communication**

**↓**

**Answer behavioral interview questions**

---

# **9\. Knowledge**

**Skill может зависеть от Knowledge.**

**Например:**

**Skill:**

**Answer interview questions**

**requires:**

**Vocabulary**

**Grammar**

**Sentence structures**

**Discourse patterns**

**Pronunciation**

**Knowledge — это не самоцель.**

**Оно существует потому, что помогает выполнить Skill.**

---

# **10\. Knowledge vs Skill**

**Это принципиальное различие.**

**Пользователь может:**

> **знать правило.**

**Но не уметь:**

> **использовать его во время разговора.**

**Поэтому:**

**Knowledge Evidence**

**≠**

**Skill Evidence**

**Оба типа могут существовать в Learning State.**

---

# **11\. MVP Learning Model**

**Для MVP используем:**

**Goal**

**↓**

**Outcomes**

**↓**

**Situations**

**↓**

**Skills**

**↓**

**Knowledge**

**Не строим полноценный Knowledge Graph.**

**Это важное ограничение.**

**Архитектурно Knowledge Graph остаётся частью долгосрочного LOS.**

**Но MVP использует упрощённую структуру данных.**

---

# **12\. Skill Priority**

**Каждый Skill получает приоритет относительно Active Goal.**

**Например:**

| Skill | Priority |
| ----- | ----- |
| **Interview Speaking** | **High** |
| **Professional Vocabulary** | **High** |
| **Listening** | **Medium** |
| **General Writing** | **Low** |

**Приоритет определяется не только текущим уровнем.**

**Учитываются:**

* **relevance to Goal;**  
* **current gap;**  
* **deadline;**  
* **available time;**  
* **evidence confidence.**

---

# **13\. Skill Gap**

**Упрощённо:**

**Required Level**

**\-**

**Current Estimated Level**

**\=**

**Skill Gap**

**Но это не должно быть единственным критерием.**

**Например:**

**Skill A**

**High Gap**

**Low Goal Relevance**

**Skill B**

**Medium Gap**

**Very High Goal Relevance**

**Второй Skill может быть более важным.**

---

# **14\. Goal-specific Required Level**

**Не существует универсального:**

> **«для этой цели нужен B2».**

**В реальности разные задачи требуют разных языковых способностей.**

**Например:**

> **Для чтения технической документации может быть достаточно сильного Reading при более слабом Speaking.**

**Поэтому MVP использует:**

> **Goal-specific requirements**

**а не один глобальный уровень языка.**

---

# **15\. CEFR**

**CEFR может использоваться как ориентир.**

**Но:**

> **CEFR не является фундаментальной единицей Learning Model.**

**Он может использоваться для:**

* **первоначальной оценки;**  
* **понятного отображения уровня;**  
* **сравнения;**  
* **внешних образовательных ориентиров.**

**Но Decision Engine должен работать прежде всего с:**

> **Goal → Skills → Evidence.**

---

# **16\. Initial Learning State**

**После Assessment система получает приблизительный:**

**Skill**

**Estimate**

**Confidence**

**Evidence**

**Например:**

**Interview Speaking**

**Estimate: A2**

**Confidence: Medium**

**Listening**

**Estimate: B1**

**Confidence: High**

**Professional Vocabulary**

**Estimate: A1/A2**

**Confidence: Low**

---

# **17\. Learning State не является одним числом**

**Не создаём:**

> **Language Score \= 67\.**

**Это слишком грубая абстракция.**

**Вместо этого:**

**Learning State**

**│**

**├── Speaking**

**├── Listening**

**├── Reading**

**├── Writing**

**├── Vocabulary**

**├── Grammar**

**└── Pronunciation**

**Каждый компонент может иметь:**

* **Estimate;**  
* **Confidence;**  
* **Priority;**  
* **Evidence.**

---

# **18\. Learning State как модель решений**

**Главная функция Learning State:**

> **помогать Decision Engine выбирать следующее действие.**

**Не:**

> **красиво показывать пользователю статистику.**

---

# **19\. Evidence Types**

**MVP должен различать несколько типов Evidence.**

### **Knowledge Evidence**

**Понимание / воспроизведение знаний.**

### **Performance Evidence**

**Выполнение языковой задачи.**

### **Communication Evidence**

**Использование языка в контексте.**

### **Assessment Evidence**

**Результат специальной диагностической Activity.**

---

# **20\. Evidence Quality**

**Не все Evidence одинаково надёжны.**

**Например:**

> **пользователь правильно выбрал перевод слова**

**даёт слабое доказательство способности:**

> **использовать это слово в разговоре.**

**Поэтому Evidence должно иметь:**

* **type;**  
* **strength;**  
* **confidence;**  
* **source.**

---

# **21\. Learning Strategy**

**Learning Strategy — это не список уроков.**

**Это текущий ответ системы на вопрос:**

> **Какие Skills сейчас наиболее важны для достижения Goal?**

**Например:**

**Current Strategy**

**1\. Improve interview speaking**

**2\. Build professional vocabulary**

**3\. Improve listening comprehension**

**4\. Reassess speaking**

**Strategy может измениться после нового Evidence.**

---

# **22\. Strategy Horizon**

**Для MVP не нужно планировать обучение на месяцы вперёд с точностью до упражнения.**

**Предлагаю:**

> **Short-horizon adaptive strategy.**

**Система должна хорошо определять:**

> **что важно сейчас и в ближайшей перспективе.**

**Например:**

**Goal**

**↓**

**Current Priorities**

**↓**

**Next Missions**

**а не:**

**Goal**

**↓**

**180-day fixed curriculum**

---

# **23\. Mission**

**Mission является контейнером образовательной цели.**

**Например:**

> **Practice answering behavioral interview questions.**

**Mission должна развивать один или небольшой набор связанных Skills.**

**Не:**

> **15 случайных упражнений.**

---

# **24\. Activities**

**Activities являются инструментами достижения Mission Goal.**

**Например:**

**Mission:**

**Behavioral Interview**

**Activities:**

**1\. Learn key expressions**

**2\. Listen to sample answer**

**3\. Answer a question**

**4\. Receive feedback**

**5\. Try again**

---

# **25\. Learning Activity Selection**

**Decision Engine выбирает Mission.**

**AI может затем выбрать или сгенерировать конкретные Activities в рамках заданной Mission.**

**Это сохраняет принцип:**

> **Decision Before Generation.**

---

# **26\. Learning ROI**

**При ограниченном времени пользователя система должна выбирать не просто:**

> **самый большой Skill Gap.**

**Она должна искать:**

> **наиболее ценный следующий learning action.**

**Упрощённо:**

**Learning ROI \=**

**Goal Relevance**

**× Skill Gap**

**× Evidence Confidence**

**× Expected Learning Impact**

**÷ Time Cost**

**Это не обязательно финальная математическая формула.**

**Для MVP это концептуальная модель.**

---

# **27\. Available Time**

**Available Time является частью Learning Model.**

**Например:**

> **15 min/day.**

**Система должна учитывать это при выборе Mission.**

**Не следует предлагать:**

> **45-minute Mission**

**пользователю, который сообщил:**

> **15 minutes/day.**

---

# **28\. Deadline**

**Deadline влияет на приоритеты.**

**Например:**

**180 days remaining**

**позволяет более спокойно распределять обучение.**

**14 days remaining**

**может требовать:**

* **более узкого focus;**  
* **высокой ROI;**  
* **сокращения второстепенных Skills.**

---

# **29\. Goal Feasibility**

**Learning Model должна учитывать:**

**Current State**

**\+**

**Required Skills**

**\+**

**Available Time**

**\+**

**Deadline**

**Но Feasibility является оценкой, а не гарантией.**

---

# **30\. Learning Loop**

**Полная MVP-модель:**

**Goal**

**↓**

**Required Outcomes**

**↓**

**Relevant Skills**

**↓**

**Current Learning State**

**↓**

**Skill Gaps**

**↓**

**Prioritization**

**↓**

**Mission**

**↓**

**Activities**

**↓**

**Evidence**

**↓**

**Learning State Update**

**↓**

**Re-prioritization**

---

# **31\. Example**

**Пользователь говорит:**

> **«Хочу пройти собеседование на английском через 2 месяца. Могу заниматься 20 минут в день».**

**Система определяет:**

### **Goal**

**Pass an English job interview.**

### **Relevant Skills**

* **interview speaking;**  
* **listening;**  
* **professional vocabulary;**  
* **pronunciation.**

### **Initial State**

**Speaking: A2**

**Listening: B1**

**Vocabulary: A2**

**Pronunciation: A2+**

### **Priorities**

**1\. Speaking**

**2\. Vocabulary**

**3\. Listening**

### **First Mission**

> **Answer common interview questions.**

**После Mission:**

**Evidence:**

**Speaking improved**

**Vocabulary remains weak**

**Decision Engine пересчитывает:**

> **Следующая Mission — professional vocabulary in interview context.**

**Это и есть адаптивное обучение.**

---

# **32\. Что MVP НЕ делает**

**MVP не пытается:**

* **моделировать весь язык;**  
* **создавать полный Knowledge Graph;**  
* **предсказывать идеальную траекторию;**  
* **давать точный CEFR score;**  
* **гарантировать достижение Goal;**  
* **обучать все Skills одновременно;**  
* **строить фиксированный curriculum.**

---

# **33\. Product Decisions**

### **MVP-5.01**

**Learning Model строится вокруг Goal-specific Skills.**

### **MVP-5.02**

**Life Goal преобразуется в Language Goal и далее в Language Outcomes.**

### **MVP-5.03**

**Language Outcomes декомпозируются в Situations и Skills.**

### **MVP-5.04**

**Knowledge является средством развития Skills, а не самостоятельной целью.**

### **MVP-5.05**

**CEFR используется как вспомогательная шкала, а не фундаментальная модель.**

### **MVP-5.06**

**Learning State не является одним общим score.**

### **MVP-5.07**

**Skill Priority зависит от Goal Relevance, Gap, Evidence и ограничений времени.**

### **MVP-5.08**

**Learning Strategy является адаптивной.**

### **MVP-5.09**

**MVP использует short-horizon strategy вместо фиксированного долгосрочного curriculum.**

### **MVP-5.10**

**Mission развивает конкретный Skill или небольшую группу связанных Skills.**

### **MVP-5.11**

**Decision Engine выбирает Mission, а AI генерирует Activities в рамках Mission.**

### **MVP-5.12**

**Available Time и Deadline являются частью learning decision.**

### **MVP-5.13**

**MVP не требует полноценного Knowledge Graph.**

---

# **34\. Assumptions**

* **Goal-specific model даст более полезные рекомендации, чем общий языковой уровень.**  
* **Пользователь лучше воспринимает Skills, привязанные к реальным ситуациям.**  
* **Short-horizon planning уменьшит сложность системы.**  
* **Mission является удобной единицей обучения.**  
* **Learning ROI можно приблизительно оценивать без сложного ML.**  
* **Пользователю не нужно видеть внутреннюю математическую модель.**

---

# **35\. Risks**

### **Goal Decomposition Quality**

**Если AI неправильно преобразует Goal в Skills, вся стратегия будет ошибочной.**

### **Over-personalization**

**Система может создать слишком специфическую модель, которая плохо переносится на другие ситуации.**

### **Skill Explosion**

**Количество Skills может быстро стать огромным.**

### **False Precision**

**Система может создавать иллюзию точного измерения языкового уровня.**

### **Educational Validity**

**AI-generated assessment может быть недостаточно надёжным.**

---

# **36\. Alternatives Considered**

### **Course-first**

**Отвергнуто.**

**Не соответствует адаптивной архитектуре.**

### **CEFR-first**

**Отвергнуто.**

**CEFR полезен, но недостаточно специфичен для Goal.**

### **Vocabulary-first**

**Отвергнуто.**

**Знание слов не гарантирует способность выполнять языковую задачу.**

### **Four Skills Only**

**Отвергнуто.**

**Слишком грубая модель.**

### **Full Knowledge Graph in MVP**

**Отложено.**

**Слишком высокая сложность до проверки core loop.**

---

# **37\. Dependencies**

**Зависит от:**

* **Goal Model;**  
* **Learning State;**  
* **Evidence;**  
* **Decision Engine.**

**Влияет на:**

* **Assessment AI;**  
* **Content Generation;**  
* **Mission;**  
* **Activity System;**  
* **Data Model.**

---

# **38\. Open Questions**

### **1\. Какой минимальный набор Skills должен быть в MVP?**

**Recommendation: начать с:**

* **Speaking;**  
* **Listening;**  
* **Reading;**  
* **Writing;**  
* **Vocabulary;**  
* **Grammar;**  
* **Pronunciation.**

**Но конкретный набор Skills для конкретной Goal должен быть динамическим.**

### **2\. Нужно ли пользователю видеть все Skills?**

**Recommendation: нет.**

**Показывать только наиболее релевантные текущие приоритеты.**

### **3\. Нужно ли использовать числовые уровни?**

**Recommendation: внутри системы — возможно.**

**В пользовательском интерфейсе MVP лучше использовать понятные описания и диапазоны, а не псевдоточность.**

---

# **39\. Acceptance Criteria**

* **Определено преобразование Life Goal → Language Goal.**  
* **Определены Language Outcomes.**  
* **Определены Situations.**  
* **Определено понятие Skill.**  
* **Разделены Skill и Knowledge.**  
* **Определена структура Learning State.**  
* **Определена логика Skill Priority.**  
* **Учитываются Deadline и Available Time.**  
* **Определена Learning Strategy.**  
* **Определена Mission как learning unit.**  
* **Определена роль Activities.**  
* **Определён Learning Loop.**  
* **Исключён полноценный Knowledge Graph из MVP implementation.**  
* **Исключена зависимость от CEFR как единственного источника решений.**

---

# **40\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Decision Before Generation** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Continuous Adaptation** | **✅** |
| **Learning ROI** | **✅** |
| **Content Agnostic** | **✅** |
| **AI as Execution Layer** | **✅** |
| **MVP Simplicity** | **✅** |
| **Goal-specific Learning** | **✅** |
| **No Fixed Curriculum** | **✅** |
| **Buildable by Founder \+ AI** | **✅** |

---

## **Итог**

**Главное решение этой главы:**

> **Мы не пытаемся научить пользователя “английскому вообще”.**

**Мы строим минимальную модель:**

**Что человек хочет сделать**

        **↓**

**Что ему нужно уметь на языке**

        **↓**

**Что он уже умеет**

        **↓**

**Чего ему не хватает**

        **↓**

**Что даст максимальный Learning ROI сейчас**

        **↓**

**Mission**

        **↓**

**Evidence**

        **↓**

**Обновлённое состояние**

**Это является образовательным ядром нашего MVP.**

# **II. LEARNING & AI**

# **6\. MVP Goal Model**

## **1\. Цель**

**Определить, как в MVP создаётся, структурируется, оценивается и изменяется пользовательская Goal.**

**Goal является отправной точкой Learning Operating System.**

**Фундаментальный принцип:**

> **Пользователь формулирует, чего хочет достичь в жизни. LOS определяет, какие языковые способности необходимы для этого результата.**

---

# **2\. Контекст**

**В предыдущей главе зафиксирована модель:**

**Life Goal**

**↓**

**Language Goal**

**↓**

**Language Outcomes**

**↓**

**Situations**

**↓**

**Skills**

**Следовательно, Goal не может быть просто текстовым полем.**

**Она должна стать структурированным объектом, с которым работает Decision Engine.**

---

# **3\. Что такое Goal**

**В LOS:**

> **Goal — это конкретный желаемый результат пользователя, для достижения которого ему необходимо использовать иностранный язык.**

**Goal должна отвечать минимум на четыре вопроса:**

1. **Что пользователь хочет достичь?**  
2. **На каком языке?**  
3. **К какому моменту?**  
4. **Какой уровень языковой способности необходим для результата?**

---

# **4\. Life Goal и Language Goal**

**Это разные уровни.**

### **Life Goal**

> **Get a job in Germany.**

### **Language Goal**

> **Communicate effectively in German during the job-search and interview situations relevant to this objective.**

**Но пользователь не должен самостоятельно создавать Language Goal.**

**LOS делает эту декомпозицию.**

---

# **5\. Goal Transformation**

**Основной flow:**

**User Input**

**↓**

**Goal Interpretation**

**↓**

**Language Requirements**

**↓**

**Goal Confirmation**

**↓**

**Active Goal**

**Например:**

> **«Хочу поступить в немецкий университет».**

**LOS определяет потенциальные языковые требования:**

* **understand academic lectures;**  
* **read academic texts;**  
* **write structured academic responses;**  
* **participate in discussions;**  
* **understand assignment instructions.**

**Пользователь подтверждает или корректирует интерпретацию.**

---

# **6\. Goal Object**

**В MVP Goal должна содержать:**

**Goal**

**│**

**├── id**

**├── title**

**├── original\_input**

**├── target\_language**

**├── deadline**

**├── available\_time**

**├── status**

**├── language\_outcomes**

**├── relevant\_skills**

**├── current\_state**

**└── created\_at**

**Не все поля обязательно вводятся пользователем.**

**Часть создаётся системой.**

---

# **7\. Goal Status**

**Используются состояния:**

**Draft**

**Active**

**Paused**

**Completed**

**Archived**

**Только одна Goal может иметь статус:**

> **Active**

---

# **8\. Draft**

**Draft используется во время создания Goal.**

**Например:**

**Goal:**

**Get a job in Germany**

**Language:**

**German**

**Deadline:**

**3 months**

**Time:**

**20 min/day**

**Пока пользователь не подтвердил интерпретацию системы, Goal остаётся Draft.**

---

# **9\. Active**

**Active Goal:**

* **определяет Learning Strategy;**  
* **определяет Recommendations;**  
* **определяет релевантность Library;**  
* **влияет на Missions;**  
* **определяет Progress.**

---

# **10\. Paused**

**Пользователь может временно остановить Goal.**

**Например:**

> **«Сейчас не могу заниматься из\-за работы».**

**При Pause:**

* **Learning Strategy не удаляется;**  
* **Learning State сохраняется;**  
* **Missions не продолжаются автоматически;**  
* **уведомления могут быть приостановлены.**

---

# **11\. Completed**

**Goal становится Completed только когда:**

> **система и пользователь согласны, что заявленный результат достигнут.**

**Важно:**

> **выполнение всех Missions ≠ Goal Completion.**

---

# **12\. Archived**

**Archived Goal сохраняется исторически, но не влияет на текущую Learning Strategy.**

---

# **13\. Active Goal**

**Active Goal — центральный контекст LOS.**

**Decision Engine при каждом основном решении должен учитывать:**

**Active Goal**

**\+**

**Learning State**

**\+**

**Evidence**

**\+**

**Available Time**

**\+**

**Deadline**

---

# **14\. Несколько Goals**

**Пользователь может создавать несколько Goals.**

**Например:**

**English Interview      Active**

**German University      Paused**

**Spanish Travel         Draft**

**Но одновременно только одна определяет текущую стратегию.**

---

# **15\. Переключение Active Goal**

**Пользователь может сделать другую Goal Active.**

**При этом:**

**Old Goal**

**↓**

**Paused**

**New Goal**

**↓**

**Active**

**Learning State не удаляется.**

**Это важно: состояние языка пользователя не должно исчезать только потому, что изменилась цель.**

---

# **16\. Goal Independence**

**Goal должна быть отделена от общей языковой идентичности пользователя.**

**Например:**

**User**

**│**

**├── English Skills**

**├── German Skills**

**└── Spanish Skills**

**Goals:**

**English → Interview**

**German → University**

**Learning State может пересекаться с несколькими Goals.**

---

# **17\. Goal-specific Requirements**

**Каждая Goal имеет собственный набор требований.**

**Например:**

### **Goal A**

> **English job interview**

**Приоритет:**

**Speaking**

**Listening**

**Professional Vocabulary**

### **Goal B**

> **Read academic papers**

**Приоритет:**

**Reading**

**Academic Vocabulary**

**Grammar**

**Один и тот же пользователь может иметь:**

> **Speaking \= strong**

**и при этом:**

> **Reading \= weak.**

**Поэтому нельзя использовать один глобальный language score.**

---

# **18\. Goal Outcomes**

**Goal декомпозируется в Language Outcomes.**

**Например:**

### **Goal**

> **Pass an English interview.**

### **Outcomes**

* **introduce yourself;**  
* **describe experience;**  
* **explain responsibilities;**  
* **answer behavioral questions;**  
* **understand questions;**  
* **ask questions.**

**Outcomes должны быть:**

* **observable;**  
* **actionable;**  
* **language-specific.**

---

# **19\. Goal не должна содержать жизненные подцели**

**Это важное ограничение.**

**Например:**

> **«Найти квартиру в Германии»**

**не должно превращаться в:**

* **search apartments;**  
* **compare prices;**  
* **sign contract.**

**Это уже действия вне образовательной области.**

**Вместо этого:**

### **Language Outcomes**

* **understand rental listings;**  
* **ask about apartment conditions;**  
* **discuss contract terms;**  
* **communicate with landlords;**  
* **understand relevant vocabulary.**

**Таким образом продукт не начинает решать жизненную задачу вместо пользователя.**

**Он определяет языковые навыки, необходимые для неё.**

---

# **20\. Goal Scope**

**Goal должна быть достаточно конкретной, чтобы:**

* **определить Skills;**  
* **определить Evidence;**  
* **определить Mission;**  
* **определить критерии успеха.**

**Но не настолько узкой, чтобы:**

* **одна небольшая ситуация становилась отдельной Goal.**

**Например:**

**❌**

> **Learn how to say “Tell me about yourself”.**

**✅**

> **Be able to handle an English job interview.**

---

# **21\. Goal Feasibility**

**После формирования Goal система должна приблизительно оценить:**

**Current State**

**\+**

**Required Skills**

**\+**

**Deadline**

**\+**

**Available Time**

**Результат:**

* **Feasible;**  
* **Challenging;**  
* **Unlikely within current constraints.**

**Это не прогноз гарантии результата.**

---

# **22\. Feasibility UX**

**Не нужно говорить:**

> **«You have a 63% probability of success».**

**Это создаёт ложную точность.**

**Вместо этого:**

> **Your goal looks challenging within 8 weeks.**

**И:**

> **Increasing practice time could improve your chances.**

---

# **23\. Goal Modification**

**Пользователь может изменить:**

* **Goal wording;**  
* **deadline;**  
* **available time;**  
* **target language.**

**Изменение этих параметров может привести к пересчёту Strategy.**

---

# **24\. Goal Change**

**Если пользователь меняет:**

> **«Пройти собеседование»**

**на:**

> **«Свободно общаться с коллегами на работе»**

**система не должна просто переименовать Goal.**

**Она должна:**

**Reinterpret Goal**

**↓**

**Recalculate Outcomes**

**↓**

**Recalculate Skill Priorities**

**↓**

**Update Learning Strategy**

---

# **25\. Goal Completion**

**Goal Completion имеет два компонента:**

### **User perception**

**Пользователь считает:**

> **«Я достиг цели».**

### **System Evidence**

**Система имеет достаточное Evidence.**

**Например:**

**Interview simulation**

**\+**

**Speaking performance**

**\+**

**Listening performance**

**\+**

**Relevant vocabulary**

**Только совместно они могут привести к:**

> **Goal Ready.**

---

# **26\. Goal Readiness vs Goal Completion**

**Это разные состояния.**

### **Ready**

**Система считает, что пользователь достиг необходимой языковой готовности.**

### **Completed**

**Пользователь подтверждает, что жизненная цель достигнута.**

**Например:**

> **система считает пользователя готовым к интервью.**

**Но:**

> **пользователь ещё не получил работу.**

**Поэтому приложение не должно утверждать:**

> **«You got the job.»**

**Оно может утверждать:**

> **You appear ready for your target interview situations.**

---

# **27\. Goal Completion Flow**

**Learning Evidence**

**↓**

**Goal Readiness Assessment**

**↓**

**System Recommendation**

**↓**

**User Confirmation**

**↓**

**Goal Completed**

---

# **28\. After Completion**

**После завершения Goal система предлагает:**

1. **Create New Goal**  
2. **Continue Learning**  
3. **Pause**

**Не создаём следующую Goal автоматически.**

**Это соответствует принципу User Agency.**

---

# **29\. Goal Creation UX**

**MVP onboarding должен быть коротким.**

**Минимальный flow:**

**What do you want to achieve?**

**↓**

**Target Language**

**↓**

**Deadline**

**↓**

**Available Time**

**↓**

**System Interpretation**

**↓**

**User Confirmation**

---

# **30\. AI Role in Goal Model**

**AI используется для:**

* **понимания естественного языка;**  
* **извлечения Goal;**  
* **определения потенциальных language outcomes;**  
* **предложения Skills;**  
* **выявления неоднозначности.**

**Но:**

> **AI не получает право незаметно менять Goal пользователя.**

**Если интерпретация существенно влияет на обучение, пользователь должен её подтвердить.**

---

# **31\. Goal Ambiguity**

**Если пользователь пишет:**

> **«Хочу выучить английский».**

**Это недостаточно конкретная Goal.**

**LOS не должен сразу строить сложную стратегию.**

**Он должен уточнить:**

> **What do you want to use English for?**

**Предлагаемые направления:**

* **work;**  
* **study;**  
* **travel;**  
* **communication;**  
* **content;**  
* **exam;**  
* **other.**

---

# **32\. Goal Clarification**

**Если система не уверена в интерпретации, она должна спросить.**

**Например:**

> **Do you mean speaking English comfortably at work, or preparing for a specific interview?**

**Это лучше, чем скрытое предположение.**

---

# **33\. Goal Quality**

**Хорошая Goal:**

* **конкретна;**  
* **связана с жизненным результатом;**  
* **требует использования языка;**  
* **имеет временной контекст;**  
* **позволяет определить observable outcomes.**

**Плохая Goal:**

> **«Хочу знать английский».**

---

# **34\. Goal Quality Check**

**MVP может использовать простой internal checklist:**

**Is there a real-world outcome?**

**Is language required?**

**Can outcomes be observed?**

**Is the scope understandable?**

**Is a time horizon available?**

**Если нет:**

> **система просит уточнить Goal.**

---

# **35\. Product Decisions**

### **MVP-6.01**

**Goal является структурированной сущностью, а не только текстом.**

### **MVP-6.02**

**Пользователь формулирует Life Goal, LOS преобразует её в Language Goal.**

### **MVP-6.03**

**Пользователь подтверждает системную интерпретацию Goal.**

### **MVP-6.04**

**Goal определяет Language Outcomes, Skills и Learning Strategy.**

### **MVP-6.05**

**Только одна Goal может быть Active.**

### **MVP-6.06**

**Несколько Goals могут существовать одновременно.**

### **MVP-6.07**

**Learning State не принадлежит исключительно одной Goal.**

### **MVP-6.08**

**Goal Completion не равен завершению Missions.**

### **MVP-6.09**

**Goal Readiness и Goal Completion являются разными состояниями.**

### **MVP-6.10**

**Жизненные подцели не становятся образовательными Tasks продукта.**

### **MVP-6.11**

**При существенном изменении Goal система пересчитывает Outcomes и Strategy.**

### **MVP-6.12**

**AI может интерпретировать Goal, но не должен скрытно менять её смысл.**

### **MVP-6.13**

**Если Goal недостаточно конкретна, система должна запросить уточнение.**

---

# **36\. Assumptions**

* **Пользователи способны сформулировать хотя бы приблизительную жизненную цель.**  
* **Уточняющие вопросы не создадут чрезмерный onboarding friction.**  
* **Goal-specific outcomes будут восприниматься пользователями как полезные.**  
* **Пользователю важно понимать, почему определённые Skills связаны с его целью.**  
* **Readiness будет более полезной метрикой, чем общий language score.**

---

# **37\. Risks**

### **Goal Misinterpretation**

**AI неправильно понял намерение пользователя.**

### **Over-questioning**

**Слишком много уточнений увеличит drop-off.**

### **Unrealistic Goals**

**Пользователь может поставить практически недостижимую цель.**

### **Goal Inflation**

**Пользователь может создавать слишком много Goals.**

### **False Readiness**

**Система может ошибочно считать пользователя готовым.**

---

# **38\. Alternatives Considered**

### **User chooses from predefined Goals only**

**Отвергнуто.**

**Это ограничивает разнообразие жизненных целей.**

### **Free-text only**

**Отвергнуто.**

**Слишком много неоднозначности.**

### **AI decides Goal automatically**

**Отвергнуто.**

**Нарушает User Agency.**

### **One Goal per user forever**

**Отвергнуто.**

**Не отражает реальную жизнь пользователя.**

### **Global Language Goal**

**Отвергнуто.**

**Не позволяет адаптировать обучение под конкретный результат.**

---

# **39\. Dependencies**

**Зависит от:**

* **User Persona;**  
* **Jobs To Be Done;**  
* **User Journey;**  
* **MVP Learning Model.**

**Влияет на:**

* **Learning State;**  
* **Evidence;**  
* **Decision Engine;**  
* **Learning Strategy;**  
* **Dashboard;**  
* **Assessment.**

---

# **40\. Open Questions**

### **1\. Должна ли Goal обязательно иметь Deadline?**

**Recommendation: нет.**

**Если пользователь не знает Deadline, Goal может существовать без него.**

**Но система должна объяснить, что отсутствие срока снижает точность планирования.**

### **2\. Должен ли пользователь сам выбирать Skills?**

**Recommendation: нет в MVP.**

**Система предлагает Skills, пользователь может корректировать Goal, но не должен вручную строить curriculum.**

### **3\. Нужно ли разрешать Goals без конкретного жизненного результата?**

**Recommendation: да, но ограниченно.**

**Например:**

> **“I want to understand English podcasts.”**

**Это уже достаточно конкретный language outcome.**

---

# **41\. Acceptance Criteria**

* **Goal имеет структурированную модель.**  
* **Разделены Life Goal и Language Goal.**  
* **Определена Goal decomposition.**  
* **Определены Language Outcomes.**  
* **Goal связана с Skills.**  
* **Определены статусы Goal.**  
* **Поддерживается Active Goal.**  
* **Поддерживается несколько Goals.**  
* **Определён Goal Readiness.**  
* **Определён Goal Completion.**  
* **Определён Goal Clarification.**  
* **Определена роль AI.**  
* **Система не подменяет жизненную цель пользователя.**  
* **Goal пригодна для Decision Engine.**

---

# **42\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **User Agency** | **✅** |
| **Decision Before Generation** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Goal-specific Learning** | **✅** |
| **Continuous Adaptation** | **✅** |
| **Content Agnostic** | **✅** |
| **No Fixed Curriculum** | **✅** |
| **Language-first** | **✅** |
| **MVP Simplicity** | **✅** |

---

## **Итог**

**Ключевое архитектурное решение этой главы:**

> **LOS не пытается выполнить жизненную цель пользователя. Он определяет, какие языковые способности необходимы пользователю для её достижения.**

**Например:**

**"Хочу снять квартиру в Германии"**

              **↓**

     **Language Goal**

              **↓**

    **Relevant situations**

              **↓**

    **Language Outcomes**

              **↓**

           **Skills**

              **↓**

      **Learning Strategy**

              **↓**

          **Missions**

              **↓**

          **Evidence**

**Таким образом мы сохраняем границу продукта:**

> **Life Goal задаёт направление.**  
> **Language Skills являются объектом обучения.**  
> **LOS управляет движением между ними.**

# **II. LEARNING & AI**

# **7\. MVP Learning State Model**

## **1\. Цель**

**Определить, как MVP хранит и обновляет представление о текущем состоянии обучения пользователя.**

**Learning State отвечает на вопрос:**

> **«Что система сейчас считает, что пользователь умеет, насколько уверена в этом и какие пробелы наиболее важны для Active Goal?»**

**Learning State является входом для Decision Engine.**

---

## **2\. Контекст**

**В предыдущих главах зафиксировано:**

**Goal**

**↓**

**Language Outcomes**

**↓**

**Skills**

**↓**

**Learning State**

**↓**

**Skill Gaps**

**↓**

**Decision**

**Learning State не является:**

* **дневником занятий;**  
* **количеством выполненных упражнений;**  
* **streak;**  
* **XP;**  
* **одним общим языковым score.**

**Это операционная модель текущих знаний и способностей пользователя, используемая для принятия образовательных решений.**

---

# **3\. Основной принцип**

**Learning State должен отвечать не на вопрос:**

> **«Сколько пользователь учился?»**

**а на вопрос:**

> **«Что мы имеем основания считать, что пользователь сейчас способен делать на языке?»**

---

# **4\. MVP Model**

**Для MVP Learning State строится вокруг Skills:**

**Learning State**

**│**

**├── Skill A**

**│   ├── Estimate**

**│   ├── Confidence**

**│   ├── Evidence**

**│   └── Last assessed**

**│**

**├── Skill B**

**│   ├── Estimate**

**│   ├── Confidence**

**│   ├── Evidence**

**│   └── Last assessed**

**│**

**└── ...**

---

# **5\. Skill State**

**Каждый Skill имеет минимальный набор характеристик:**

**SkillState**

**│**

**├── skill\_id**

**├── estimated\_level**

**├── confidence**

**├── evidence\_count**

**├── last\_evidence\_at**

**└── trend**

---

# **6\. Estimated Level**

**Estimated Level — текущая оценка способности пользователя.**

**Для MVP не требуется сложная непрерывная шкала.**

**Можно использовать:**

**Low**

**Basic**

**Developing**

**Functional**

**Strong**

**Внутри системы при необходимости можно использовать числовое представление.**

**Но пользовательский интерфейс не должен создавать иллюзию научной точности.**

---

# **7\. Confidence**

**Confidence показывает:**

> **насколько система уверена в оценке Skill.**

**Например:**

**Speaking**

**Estimate: Developing**

**Confidence: High**

**или:**

**Vocabulary**

**Estimate: Developing**

**Confidence: Low**

**Это принципиально важно.**

**Оценка:**

> **Developing / High confidence**

**и:**

> **Developing / Low confidence**

**не являются одинаковыми состояниями.**

---

# **8\. Почему Confidence необходим**

**Предположим, пользователь только один раз правильно ответил на вопрос.**

**Система не должна сразу считать:**

> **пользователь освоил Skill.**

**Вместо этого:**

**Estimate: Developing**

**Confidence: Low**

**После нескольких независимых Evidence:**

**Estimate: Developing**

**Confidence: Medium**

**А после устойчивого performance:**

**Estimate: Functional**

**Confidence: High**

---

# **9\. Evidence Count**

**Evidence Count — количество релевантных наблюдений.**

**Но:**

> **больше Evidence ≠ автоматически выше уровень.**

**Пять одинаковых простых упражнений не обязательно дают пять независимых подтверждений Skill.**

**Поэтому Evidence Count является вспомогательным показателем.**

---

# **10\. Last Evidence**

**Система должна знать:**

> **когда Skill последний раз проверялся.**

**Например:**

**Speaking**

**Last evidence: 2 days ago**

**Это позволяет учитывать актуальность состояния.**

---

# **11\. Trend**

**MVP может хранить простое направление:**

* **Improving;**  
* **Stable;**  
* **Declining;**  
* **Unknown.**

**Trend не должен определяться после одного задания.**

---

# **12\. Skill State Lifecycle**

**Unknown**

**↓**

**Estimated**

**↓**

**Observed**

**↓**

**Confirmed**

**↓**

**Updated**

**Например:**

### **Unknown**

**Система ничего не знает о Speaking.**

### **Estimated**

**Assessment дал предварительную оценку.**

### **Observed**

**Пользователь выполнил несколько релевантных Activities.**

### **Confirmed**

**Evidence достаточно для повышения confidence.**

### **Updated**

**Новые данные изменили оценку.**

---

# **13\. Unknown State**

**Это важное состояние.**

**Если система не имеет достаточного Evidence, она должна иметь возможность сказать:**

> **We don't know yet.**

**Это лучше, чем придумывать уровень.**

---

# **14\. Learning State ≠ User Profile**

**Profile содержит:**

* **настройки;**  
* **предпочтения;**  
* **account information.**

**Learning State содержит:**

* **Skills;**  
* **Estimates;**  
* **Confidence;**  
* **Evidence.**

**Не смешиваем эти сущности.**

---

# **15\. Learning State ≠ Goal**

**Goal определяет:**

> **куда пользователь хочет прийти.**

**Learning State определяет:**

> **где пользователь находится сейчас.**

**Например:**

**Goal:**

**Pass an English interview**

**Learning State:**

**Speaking — Developing**

**Listening — Functional**

**Vocabulary — Developing**

---

# **16\. Learning State ≠ Progress**

**Progress отвечает:**

> **насколько пользователь приблизился к Goal.**

**Learning State отвечает:**

> **что система считает о его текущих способностях.**

**Они связаны, но не идентичны.**

---

# **17\. Goal-specific View**

**Один Learning State может использоваться разными Goals.**

**Например:**

**Global Learning State**

**English Speaking:**

**Functional**

**English Reading:**

**Strong**

**Для Goal:**

> **Job Interview**

**система выбирает:**

**Speaking → High relevance**

**Reading → Low relevance**

**Для другой Goal:**

> **Read academic literature**

**приоритеты будут другими.**

---

# **18\. Skill Gap**

**Skill Gap определяется относительно Goal:**

**Required Skill State**

**\-**

**Current Skill State**

**\=**

**Gap**

**Но в Decision Engine учитываются также:**

* **confidence;**  
* **goal relevance;**  
* **deadline;**  
* **available time.**

---

# **19\. Example**

**Goal:**

**English Interview**

**Skill               Required    Current     Confidence**

**\--------------------------------------------------------**

**Interview Speaking   Strong      Developing  High**

**Listening             Functional  Functional  High**

**Vocabulary            Functional  Basic       Medium**

**Reading               Basic       Strong      High**

**Decision Engine не должен автоматически выбрать Reading только потому, что там есть разница.**

**Goal relevance имеет приоритет.**

---

# **20\. State Update**

**Learning State изменяется только при наличии Evidence.**

**Основной цикл:**

**Activity**

**↓**

**Performance**

**↓**

**Evidence**

**↓**

**Evidence Evaluation**

**↓**

**Learning State Update**

---

# **21\. Не каждое действие изменяет Learning State**

**Например:**

**Пользователь:**

> **открыл материал.**

**Это событие.**

**Но не обязательно Evidence.**

**Пользователь:**

> **прочитал статью.**

**Тоже не обязательно Evidence.**

**Пользователь:**

> **выполнил диагностическое задание.**

**Это уже потенциальное Evidence.**

---

# **22\. Learning Event vs Evidence**

**Разделяем:**

### **Learning Event**

**Что произошло.**

**Например:**

> **User completed activity.**

### **Evidence**

**Что это событие позволяет заключить о способности пользователя.**

**Например:**

> **User successfully used target vocabulary in a contextual response.**

**Это критически важное разделение.**

---

# **23\. Evidence Aggregation**

**Если есть несколько Evidence:**

**Evidence 1**

**Speaking performance**

**↓**

**Evidence 2**

**Speaking performance**

**↓**

**Evidence 3**

**Speaking simulation**

**↓**

**Aggregate**

**↓**

**Update Skill State**

**MVP может использовать простые правила вместо сложной статистической модели.**

---

# **24\. MVP Update Logic**

**Например:**

### **Weak Evidence**

**Не изменять уровень.**

### **Repeated positive Evidence**

**Повысить confidence.**

### **Strong performance across contexts**

**Возможное повышение estimate.**

### **Repeated poor performance**

**Снизить estimate или confidence.**

**Это не должно быть жёстко зашито навсегда.**

---

# **25\. Hysteresis Principle**

**Learning State не должен прыгать:**

**Developing**

**↓**

**Functional**

**↓**

**Developing**

**↓**

**Functional**

**после каждого упражнения.**

**Изменение состояния должно требовать достаточного Evidence.**

**Это защищает UX и Decision Engine от нестабильности.**

---

# **26\. Forgetting / Decay**

**В долгосрочной архитектуре знания могут забываться.**

**Но для MVP не следует реализовывать сложную математическую модель forgetting curve.**

**Можно использовать простой механизм:**

> **старое Evidence постепенно получает меньший вес при принятии новых решений.**

**Это можно добавить после проверки core loop.**

---

# **27\. Confidence Decay**

**Важно различать:**

> **Skill decay**

**и:**

> **Evidence freshness.**

**Пользователь может не демонстрировать Skill несколько месяцев.**

**Это не означает автоматически:**

> **он его забыл.**

**Но система может стать менее уверенной.**

---

# **28\. User Visibility**

**Пользователь не должен видеть всю внутреннюю модель.**

**Не показываем:**

**Speaking:**

**0.6743**

**Confidence:**

**0.7812**

**Показываем:**

> **Speaking — Developing**

**и:**

> **Your current priority**

---

# **29\. What User Should See**

**Пользователь должен видеть:**

* **сильные стороны;**  
* **текущие пробелы;**  
* **приоритет;**  
* **прогресс;**  
* **объяснение рекомендаций.**

**Не обязан видеть:**

* **внутренние confidence scores;**  
* **формулы;**  
* **сырые Evidence;**  
* **системные идентификаторы.**

---

# **30\. Mascot Connection**

**Mascot может использовать Learning State как источник meaningful progress.**

**Например:**

**Evidence**

**\+**

**Skill Improvement**

**↓**

**Meaningful Learning Event**

**↓**

**Mascot Growth**

**Не:**

> **пользователь открыл приложение → mascot вырос.**

---

# **31\. Gamification Boundary**

**Mascot не должен напрямую вознаграждать:**

* **количество открытий;**  
* **количество минут;**  
* **количество нажатий.**

**Основное условие роста:**

> **реальное или достаточно обоснованное Evidence of Learning.**

---

# **32\. Learning State and Recommendation**

**Decision Engine получает:**

**Goal**

**\+**

**Learning State**

**\+**

**Evidence**

**\+**

**Constraints**

**и определяет:**

> **следующий наиболее полезный шаг.**

**Следовательно:**

> **Learning State не генерирует Recommendation самостоятельно.**

---

# **33\. Example of Adaptation**

**До Mission:**

**Speaking:**

**Developing / High confidence**

**Vocabulary:**

**Basic / Medium confidence**

**После Mission:**

**Speaking:**

**Functional / Medium-high confidence**

**Vocabulary:**

**Basic / Medium confidence**

**Decision Engine делает вывод:**

> **Speaking gap уменьшился.**

**Следующая Recommendation:**

> **Vocabulary practice in interview context.**

---

# **34\. Minimal Data Model**

**Для AI-assisted MVP предлагаем максимально простую структуру:**

**User**

  **↓**

**LearningState**

  **↓**

**SkillState**

  **↓**

**Evidence**

**Например:**

**SkillState {**

    **skillId**

    **estimatedLevel**

    **confidence**

    **evidenceCount**

    **lastEvidenceAt**

    **trend**

**}**

**Это достаточно для первого прототипа.**

---

# **35\. Что НЕ строим в MVP**

**Не строим:**

* **сложную probabilistic learner model;**  
* **полноценную Bayesian knowledge tracing;**  
* **neurological model;**  
* **detailed forgetting simulation;**  
* **universal language score;**  
* **predictive mastery engine;**  
* **сложный ML pipeline для state estimation.**

**Это architecture future.**

---

# **36\. Product Decisions**

### **MVP-7.01**

**Learning State является операционной моделью текущих языковых способностей пользователя.**

### **MVP-7.02**

**Learning State строится вокруг Skills.**

### **MVP-7.03**

**Каждый Skill имеет Estimate и Confidence.**

### **MVP-7.04**

**Unknown является допустимым состоянием.**

### **MVP-7.05**

**Learning Event и Evidence — разные сущности.**

### **MVP-7.06**

**Learning State изменяется только на основании Evidence.**

### **MVP-7.07**

**Одно выполнение Activity не гарантирует изменение Learning State.**

### **MVP-7.08**

**Evidence может иметь разную силу.**

### **MVP-7.09**

**Learning State должен быть устойчивым к случайным колебаниям.**

### **MVP-7.10**

**MVP не реализует сложную модель forgetting.**

### **MVP-7.11**

**Learning State используется Decision Engine, а не отображается пользователю в полном внутреннем виде.**

### **MVP-7.12**

**Mascot получает meaningful progress из Learning State / Evidence.**

---

# **37\. Assumptions**

* **Простая модель Estimate \+ Confidence достаточна для MVP.**  
* **Несколько Evidence будут достаточно хорошо отражать реальные способности.**  
* **Пользователю не нужна полная прозрачность внутренней модели.**  
* **Упрощённые update rules позволят проверить core loop.**  
* **Более сложная learner model может быть добавлена позже без изменения основной архитектуры.**

---

# **38\. Risks**

### **False Assessment**

**AI неправильно оценит способность.**

### **Sparse Evidence**

**Система может иметь слишком мало данных.**

### **Overconfidence**

**Несколько удачных ответов могут искусственно повысить оценку.**

### **Underconfidence**

**Сложное упражнение может создать ложное впечатление слабого навыка.**

### **State Instability**

**Слишком частые изменения ухудшат Recommendation.**

### **Gamification Distortion**

**Mascot может стимулировать выполнение действий вместо реального обучения.**

---

# **39\. Alternatives Considered**

### **One Global Score**

**Отвергнуто.**

**Не позволяет принимать Goal-specific decisions.**

### **CEFR Only**

**Отвергнуто.**

**Слишком грубая модель.**

### **Activity Completion as Progress**

**Отвергнуто.**

**Не соответствует Evidence Before Assumption.**

### **Full ML Learner Model**

**Отложено.**

**Необходимо слишком много данных для MVP.**

### **No Learning State**

**Отвергнуто.**

**Тогда продукт превращается в обычный генератор упражнений.**

---

# **40\. Dependencies**

**Зависит от:**

* **Goal Model;**  
* **Skill Model;**  
* **Evidence Model;**  
* **Assessment;**  
* **Activity System.**

**Влияет на:**

* **Decision Engine;**  
* **Recommendation;**  
* **Mission;**  
* **Progress;**  
* **Mascot;**  
* **Analytics.**

---

# **41\. Open Questions**

### **1\. Нужны ли числовые Estimate внутри backend?**

**Recommendation: да, потенциально.**

**Даже если UI использует категории, backend может хранить нормализованное значение.**

**Это упростит дальнейшее развитие модели.**

### **2\. Как именно считать Confidence?**

**Recommendation: определить в следующей главе 8\. MVP Evidence Model.**

**Не следует преждевременно фиксировать формулу здесь.**

### **3\. Может ли пользователь вручную корректировать Learning State?**

**Recommendation: ограниченно.**

**Пользователь может сообщить:**

> **«Это слишком легко для меня».**

**Но система не должна без Evidence автоматически считать Skill mastered.**

---

# **42\. Acceptance Criteria**

* **Определена сущность Learning State.**  
* **Определена сущность Skill State.**  
* **Разделены Estimate и Confidence.**  
* **Разделены Learning Event и Evidence.**  
* **Определено, когда State может изменяться.**  
* **Определена базовая логика обновления.**  
* **Предусмотрено Unknown state.**  
* **Предусмотрена устойчивость к случайным изменениям.**  
* **Learning State пригоден для Decision Engine.**  
* **Learning State не превращён в один общий score.**  
* **MVP implementation остаётся простой.**

---

# **43\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Decision Before Generation** | **✅** |
| **Continuous Adaptation** | **✅** |
| **Learning ROI** | **✅** |
| **Explainable Intelligence** | **✅** |
| **User Agency** | **✅** |
| **MVP Simplicity** | **✅** |
| **AI as Execution Layer** | **✅** |
| **Mascot tied to learning** | **✅** |

---

## **Итог**

**Learning State становится памятью образовательной системы.**

**Не:**

> **«Пользователь сделал 17 упражнений».**

**А:**

> **«На основании имеющихся Evidence система считает, что пользователь способен делать X, с такой-то степенью уверенности, а для его Active Goal сейчас наиболее важен Y».**

# **II. LEARNING & AI**

# **8\. MVP Evidence Model**

## **1\. Цель**

**Определить, какие наблюдения система может использовать как доказательство языковой способности пользователя и как на их основании обновлять Learning State.**

**Ключевой принцип:**

> **Выполненное упражнение — это событие. Evidence — это вывод о способности пользователя, который можно обосновать этим событием.**

---

# **2\. Контекст**

**Learning Loop:**

**Goal**

**↓**

**Skill**

**↓**

**Activity**

**↓**

**Performance**

**↓**

**Evidence**

**↓**

**Learning State**

**↓**

**Recommendation**

**Если Evidence недостаточно качественное, вся последующая персонализация становится ненадёжной.**

**Поэтому Evidence является одним из центральных объектов LOS.**

---

# **3\. Что такое Evidence**

**Evidence — это наблюдаемое свидетельство того, что пользователь обладает определённой языковой способностью или испытывает с ней затруднение.**

**Пример:**

> **Пользователь правильно ответил на вопрос, используя целевую лексику в контексте собеседования.**

**Это Evidence для:**

> **Professional Interview Vocabulary.**

---

# **4\. Evidence не равно результату**

**Например:**

> **8/10 правильных ответов.**

**Это Performance Result.**

**А вывод:**

> **Пользователь демонстрирует способность распознавать базовую профессиональную лексику.**

**Это Evidence.**

**Разделение необходимо, чтобы Decision Engine не работал напрямую с сырыми результатами.**

---

# **5\. Evidence Object**

**Минимальная структура:**

**Evidence**

**│**

**├── id**

**├── user\_id**

**├── skill\_id**

**├── activity\_id**

**├── evidence\_type**

**├── performance**

**├── strength**

**├── context**

**├── created\_at**

**└── evaluator**

---

# **6\. Evidence Type**

**Для MVP достаточно четырёх основных типов.**

### **1\. Assessment Evidence**

**Получено в диагностическом Assessment.**

### **2\. Performance Evidence**

**Получено при выполнении обычной Activity.**

### **3\. Communication Evidence**

**Получено при использовании языка в более реалистичной коммуникационной ситуации.**

### **4\. Self-Reported Evidence**

**Информация, сообщённая пользователем.**

---

# **7\. Assessment Evidence**

**Пример:**

**Пользователь проходит initial assessment.**

**Система получает:**

> **User successfully understands common interview questions.**

**Это Evidence.**

**Assessment Evidence особенно важно в начале обучения, когда других данных ещё мало.**

---

# **8\. Performance Evidence**

**Получается из обычных Missions.**

**Например:**

> **Пользователь правильно использовал 8 из 10 целевых выражений.**

**Это Evidence для соответствующего Vocabulary Skill.**

---

# **9\. Communication Evidence**

**Наиболее ценный тип Evidence для Goal-oriented learning.**

**Например:**

> **Пользователь самостоятельно ответил на вопрос интервью на английском.**

**Здесь система наблюдает не отдельное знание, а выполнение языковой задачи.**

---

# **10\. Self-Reported Evidence**

**Пользователь может сообщить:**

> **«Я уже свободно разговариваю на работе».**

**Это полезная информация.**

**Но она не должна иметь такой же вес, как наблюдаемая performance.**

**Поэтому:**

> **Self-Reported Evidence используется прежде всего для настройки и формирования гипотез, а не как сильное подтверждение mastery.**

---

# **11\. Evidence Strength**

**Каждое Evidence получает Strength.**

**Для MVP:**

**Weak**

**Moderate**

**Strong**

---

# **12\. Weak Evidence**

**Примеры:**

* **один простой вопрос;**  
* **recognition task;**  
* **self-report;**  
* **подсказанный ответ.**

**Weak Evidence может:**

* **немного изменить Confidence;**  
* **помочь выбрать следующую Activity.**

**Но не должно само по себе подтверждать Skill.**

---

# **13\. Moderate Evidence**

**Примеры:**

* **несколько заданий;**  
* **contextual vocabulary task;**  
* **короткий written response;**  
* **listening task без подсказок.**

**Может существенно влиять на Confidence.**

---

# **14\. Strong Evidence**

**Примеры:**

* **open-ended response;**  
* **realistic simulation;**  
* **spontaneous speaking;**  
* **выполнение комплексной языковой задачи;**  
* **успешная коммуникация в релевантном контексте.**

**Strong Evidence может существенно влиять на Skill Estimate.**

---

# **15\. Context**

**Evidence без контекста ограничено.**

**Например:**

> **Пользователь знает слово “negotiate”.**

**Это не означает:**

> **пользователь умеет вести переговоры.**

**Поэтому Evidence должно по возможности содержать:**

**context:**

**job interview**

**или:**

**context:**

**workplace communication**

---

# **16\. Goal Relevance**

**Одно и то же Evidence может иметь разную ценность для разных Goals.**

**Например:**

> **пользователь написал хороший рассказ.**

**Это Evidence для Writing.**

**Но для:**

> **Job Interview**

**его relevance может быть ниже, чем speaking performance.**

**Поэтому Evidence имеет:**

> **Skill relevance**

**и получает значение уже относительно конкретной Goal.**

---

# **17\. Evidence Confidence**

**Evidence должно иметь собственную надёжность.**

**Например:**

> **Speech recognition плохо распознал запись.**

**Даже если AI оценил ответ как хороший, confidence должен быть ниже.**

**Поэтому:**

**Evidence Strength**

**≠**

**Evidence Confidence**

---

# **18\. Evaluator**

**Evidence может быть получено разными способами:**

**Human**

**AI**

**Automated**

**User**

**В MVP большинство Evidence будет оцениваться AI.**

**Но система должна сохранять:**

> **кто / что сделал оценку.**

---

# **19\. AI Evaluation**

**AI может анализировать:**

### **Speaking**

* **fluency;**  
* **vocabulary;**  
* **grammar;**  
* **pronunciation;**  
* **task completion.**

### **Writing**

* **clarity;**  
* **grammar;**  
* **vocabulary;**  
* **task completion.**

### **Listening**

* **comprehension;**  
* **interpretation.**

### **Reading**

* **comprehension;**  
* **inference.**

---

# **20\. Ограничение AI Evaluation**

**AI не должен возвращать только:**

> **Score: 82%.**

**Он должен возвращать структурированный результат:**

**Skill**

**Performance**

**Strength**

**Confidence**

**Observed evidence**

**Это делает систему пригодной для последующего reasoning.**

---

# **21\. Example**

**Пользователь отвечает:**

> **“In my previous job I was responsible for managing a small team…”**

**AI evaluation:**

**Skill:**

**Describe professional experience**

**Performance:**

**Successful**

**Strength:**

**Strong**

**Confidence:**

**High**

**Observed:**

**Used relevant professional vocabulary**

**Explained responsibility clearly**

**Это превращается в Evidence.**

---

# **22\. Evidence Aggregation**

**Learning State обновляется не одним Evidence, а совокупностью наблюдений.**

**Evidence 1**

**\+**

**Evidence 2**

**\+**

**Evidence 3**

**↓**

**Evidence Aggregation**

**↓**

**Skill State Update**

---

# **23\. Independent Evidence**

**Важно учитывать разнообразие Evidence.**

**Например:**

**10 vocabulary quizzes**

**не обязательно сильнее:**

**3 different contextual tasks**

**Поэтому система должна учитывать:**

> **diversity of evidence.**

---

# **24\. Evidence Diversity**

**MVP может различать:**

* **recognition;**  
* **recall;**  
* **production;**  
* **communication.**

**Например:**

**Recognition**

**↓**

**Recall**

**↓**

**Production**

**↓**

**Communication**

**Чем ближе Evidence к реальному использованию языка, тем ценнее оно для соответствующей Goal.**

---

# **25\. Evidence Hierarchy**

**Для Goal-oriented learning:**

**Knowledge recognition**

        **↓**

**Controlled production**

        **↓**

**Contextual production**

        **↓**

**Open-ended production**

        **↓**

**Realistic communication**

**Это не означает, что нижние уровни бесполезны.**

**Они просто дают разные типы Evidence.**

---

# **26\. Evidence Expiration**

**Evidence не должно автоматически исчезать.**

**Но старое Evidence может иметь меньший вес при принятии решений.**

**Например:**

**Recent Evidence**

**→ higher decision weight**

**Old Evidence**

**→ lower decision weight**

**Это позволяет учитывать актуальность без сложной модели forgetting.**

---

# **27\. Contradictory Evidence**

**Возможна ситуация:**

**Strong Evidence:**

**Speaking Functional**

**Later Evidence:**

**Speaking Basic**

**Система не должна мгновенно выбирать одно из них.**

**Она должна:**

1. **сохранить оба Evidence;**  
2. **оценить контекст;**  
3. **проверить качество;**  
4. **определить, действительно ли изменилось состояние;**  
5. **при необходимости назначить дополнительную диагностическую Activity.**

---

# **28\. Evidence Gap**

**Если система недостаточно уверена:**

> **не нужно придумывать оценку.**

**Можно создать:**

> **Evidence Gap.**

**Например:**

> **We don't have enough evidence about your ability to understand fast conversations.**

**И следующей Recommendation станет:**

> **Listening diagnostic.**

---

# **29\. Evidence-driven Recommendation**

**Decision Engine может выбрать:**

**Current State:**

**Listening confidence low**

**Goal:**

**Job interview**

**↓**

**Recommendation**

**Run listening diagnostic**

**То есть Recommendation может быть не обучением, а:**

> **получением недостающего Evidence.**

**Это важное свойство LOS.**

---

# **30\. Evidence Quality**

**Минимальная модель:**

**Evidence Quality \=**

**Strength**

**×**

**Confidence**

**×**

**Relevance**

**×**

**Recency**

**Для MVP это концептуальная модель.**

**Не требуется сразу реализовывать сложную математическую формулу.**

---

# **31\. Evidence and Mascot**

**Mascot получает прогресс только после meaningful learning event.**

**Например:**

**Strong Evidence**

**↓**

**Skill State improvement**

**↓**

**Learning milestone**

**↓**

**Mascot growth**

**Это защищает систему от:**

> **«игрок кликает ради роста питомца».**

---

# **32\. Evidence and Gamification**

**XP можно давать за completion.**

**Но meaningful mascot growth должен зависеть от learning outcomes.**

**Таким образом:**

**Activity completion**

**→ small reward**

**Learning evidence**

**→ meaningful progress**

---

# **33\. Evidence and Library**

**Прочитанный материал сам по себе не является Evidence.**

**Например:**

> **User opened an article.**

**Это Event.**

**Если после этого пользователь:**

> **successfully applies the learned vocabulary,**

**появляется Evidence.**

---

# **34\. Evidence and External Materials**

**Публичные материалы могут использоваться как источник обучения.**

**Но система не должна автоматически считать:**

> **material consumed \= skill acquired.**

**Evidence возникает только после проверки.**

---

# **35\. Evidence Sources**

**MVP может получать Evidence из:**

* **assessment;**  
* **activities;**  
* **mission simulations;**  
* **user responses;**  
* **speaking recordings;**  
* **writing responses.**

**Не обязательно сразу интегрировать реальные внешние образовательные платформы.**

---

# **36\. Что НЕ считается Evidence**

**Не считаем сильным Evidence:**

* **opening app;**  
* **opening material;**  
* **reading lesson;**  
* **watching video;**  
* **completing streak;**  
* **spending time;**  
* **earning XP.**

**Это behavioural data, а не learning evidence.**

---

# **37\. Behaviour vs Learning**

**Разделяем:**

**Behavioural Data**

**↓**

**What user did**

**Learning Evidence**

**↓**

**What user demonstrated**

**Оба типа данных полезны.**

**Но они используются для разных решений.**

---

# **38\. MVP Data Model**

**Минимальная структура:**

**Evidence {**

    **id**

    **skillId**

    **activityId**

    **type**

    **strength**

    **confidence**

    **context**

    **performance**

    **evaluator**

    **createdAt**

**}**

**Это достаточно просто для AI-assisted implementation.**

---

# **39\. Evidence Processing Pipeline**

**Activity**

**↓**

**User Response**

**↓**

**AI / Rule Evaluation**

**↓**

**Performance Result**

**↓**

**Evidence Extraction**

**↓**

**Evidence Storage**

**↓**

**Learning State Update**

---

# **40\. AI Output Contract**

**AI evaluator должен возвращать структурированные данные.**

**Например:**

**{**

  **"skill": "...",**

  **"performance": "...",**

  **"evidence\_strength": "...",**

  **"confidence": "...",**

  **"observations": \[...\]**

**}**

**В MVP AI не должен напрямую изменять Learning State.**

**Он возвращает Evidence.**

**Затем application logic принимает решение:**

> **как Evidence влияет на State.**

**Это важное архитектурное разделение.**

---

# **41\. Why AI Should Not Directly Update State**

**Если LLM напрямую пишет:**

> **Speaking \= 0.78**

**мы получаем:**

* **непредсказуемость;**  
* **сложность тестирования;**  
* **невозможность контролировать изменения;**  
* **сложность debugging.**

**Правильнее:**

**LLM**

**↓**

**Structured Evidence**

**↓**

**Deterministic State Logic**

**↓**

**Learning State**

---

# **42\. Product Decisions**

### **MVP-8.01**

**Evidence является отдельной сущностью.**

### **MVP-8.02**

**Learning Event и Evidence разделены.**

### **MVP-8.03**

**Evidence имеет Type, Strength и Confidence.**

### **MVP-8.04**

**Evidence должно быть связано с Skill.**

### **MVP-8.05**

**Evidence по возможности должно иметь Context.**

### **MVP-8.06**

**Self-Reported Evidence имеет меньший вес, чем наблюдаемая performance.**

### **MVP-8.07**

**Evidence должно агрегироваться.**

### **MVP-8.08**

**Разнообразное Evidence ценнее множества повторяющихся одинаковых тестов.**

### **MVP-8.09**

**Старое Evidence может иметь меньший вес.**

### **MVP-8.10**

**Противоречивое Evidence не должно мгновенно менять State.**

### **MVP-8.11**

**Недостаток Evidence может сам стать причиной Recommendation.**

### **MVP-8.12**

**LLM создаёт Structured Evidence, но не изменяет Learning State напрямую.**

### **MVP-8.13**

**Поведение пользователя и Learning Evidence хранятся отдельно.**

---

# **43\. Assumptions**

* **AI способен давать достаточно полезную структурированную оценку для MVP.**  
* **Простые правила агрегации будут достаточны для первых тестов.**  
* **Contextual performance даст более полезное Evidence, чем isolated quizzes.**  
* **Пользователю будет понятна обратная связь, основанная на наблюдаемой performance.**

---

# **44\. Risks**

### **AI Evaluation Error**

**AI может неправильно интерпретировать ответ.**

### **Speech Recognition Error**

**Ошибки транскрипции могут повлиять на evaluation.**

### **Evidence Inflation**

**Система может переоценить большое количество однотипных заданий.**

### **False Confidence**

**Красивый AI feedback может создавать иллюзию точности.**

### **Cost**

**Частая LLM evaluation может увеличить стоимость MVP.**

---

# **45\. Cost Control**

**Для нашего MVP особенно важно:**

> **не отправлять каждый пользовательский event в дорогую LLM evaluation.**

**Используем уровни:**

**Cheap / deterministic checks**

**↓**

**Local or simple evaluation**

**↓**

**LLM evaluation when needed**

**↓**

**Strong Evidence**

**Например:**

**простое multiple choice:**

> **не требует LLM.**

**Open-ended speaking:**

> **требует AI evaluation.**

---

# **46\. Alternatives Considered**

### **Every Activity → LLM Evaluation**

**Отвергнуто.**

**Слишком дорого и необязательно.**

### **Only Quiz Scores**

**Отвергнуто.**

**Не отражает реальную языковую способность.**

### **User Self-Assessment Only**

**Отвергнуто.**

**Недостаточно надёжно.**

### **LLM Directly Updates Learning State**

**Отвергнуто.**

**Слишком непрозрачно и трудно тестировать.**

---

# **47\. Dependencies**

**Зависит от:**

* **Activity Model;**  
* **Skill Model;**  
* **Learning State;**  
* **AI Evaluation;**  
* **Decision Engine.**

**Влияет на:**

* **Recommendation;**  
* **Mission;**  
* **Mascot;**  
* **Progress;**  
* **analytics;**  
* **AI cost.**

---

# **48\. Open Questions**

### **1\. Как именно рассчитывать Strength?**

**Recommendation: сначала использовать rule-based классификацию.**

### **2\. Какой AI использовать для evaluation?**

**Это будет определено в технической архитектуре.**

### **3\. Нужно ли хранить raw user response?**

**Recommendation: да, если это необходимо для повторной оценки, debugging и обучения системы, с учётом privacy requirements.**

---

# **49\. Acceptance Criteria**

* **Evidence отделено от Activity completion.**  
* **Определены типы Evidence.**  
* **Определена Strength.**  
* **Определена Confidence.**  
* **Учитывается Context.**  
* **Учитывается Goal Relevance.**  
* **Учитывается Recency.**  
* **Учитывается Evidence Diversity.**  
* **Определено поведение при недостатке Evidence.**  
* **Определено поведение при противоречивом Evidence.**  
* **LLM не изменяет Learning State напрямую.**  
* **Определён минимальный Evidence data model.**  
* **Предусмотрен cost control.**

---

# **50\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Evidence Before Assumption** | **✅** |
| **Decision Before Generation** | **✅** |
| **Continuous Adaptation** | **✅** |
| **Explainable Intelligence** | **✅** |
| **AI as Execution Layer** | **✅** |
| **Cost Awareness** | **✅** |
| **Goal-specific Learning** | **✅** |
| **MVP Simplicity** | **✅** |
| **User Agency** | **✅** |

---

## **Итог**

**Главное решение этой главы:**

> **LLM не должен быть “мозгом, который напрямую меняет уровень пользователя”.**

**Мы строим контролируемый pipeline:**

**User Response**

      **↓**

**AI Evaluation**

      **↓**

**Structured Evidence**

      **↓**

**Deterministic State Update**

      **↓**

**Learning State**

      **↓**

**Decision Engine**

      **↓**

**Next Mission**

**Это одновременно:**

* **дешевле;**  
* **предсказуемее;**  
* **проще тестировать;**  
* **проще реализовать через AI;**  
* **позволяет постепенно заменять отдельные AI-компоненты более точными моделями.**

**И теперь у нас определены три ключевых слоя:**

**Goal**

  **↓**

**Learning State**

  **↓**

**Evidence**

# **II. LEARNING & AI**

# **9\. MVP Decision Engine**

## **1\. Цель**

**Определить механизм, который принимает решение:**

> **что пользователю полезнее всего делать сейчас.**

**Decision Engine — это центральный механизм адаптивности LOS.**

**Он связывает:**

**Goal**

**\+**

**Learning State**

**\+**

**Evidence**

**\+**

**Constraints**

**↓**

**Decision**

**↓**

**Next Mission**

---

# **2\. Главный принцип**

**LOS не должен постоянно спрашивать:**

> **«Какой урок показать дальше?»**

**Он должен решать:**

> **«Какое следующее действие с наибольшей вероятностью приблизит пользователя к его Goal?»**

---

# **3\. Decision Engine ≠ AI Chat**

**Decision Engine — это не чат.**

**Он должен принимать структурированные решения.**

**Например:**

**Goal:**

**English interview**

**Current State:**

**Speaking — Developing**

**Vocabulary — Basic**

**Evidence:**

**Speaking improving**

**Vocabulary weak**

**Constraints:**

**20 min/day**

**Decision:**

**Practice professional vocabulary in interview context**

---

# **4\. Decision Pipeline**

**Active Goal**

      **↓**

**Required Skills**

      **↓**

**Current Learning State**

      **↓**

**Evidence**

      **↓**

**Skill Gaps**

      **↓**

**Prioritization**

      **↓**

**Candidate Missions**

      **↓**

**Mission Ranking**

      **↓**

**Next Mission**

---

# **5\. Inputs**

**Decision Engine получает:**

### **Goal**

* **objective;**  
* **target language;**  
* **deadline;**  
* **relevant outcomes.**

### **Learning State**

* **Skill estimates;**  
* **confidence;**  
* **trends.**

### **Evidence**

* **recent performance;**  
* **evidence quality;**  
* **context.**

### **Constraints**

* **available time;**  
* **user preferences;**  
* **current session context.**

---

# **6\. Constraints**

**Для MVP учитываем:**

**Available Time**

**Deadline**

**Current Skill Priority**

**Recent Activities**

**User Preferences**

**Не нужно сразу учитывать десятки факторов.**

---

# **7\. Skill Gap**

**Первый этап:**

> **определить, где существует наиболее значимый gap.**

**Но:**

> **максимальный gap ≠ автоматически следующий Skill.**

---

# **8\. Skill Priority**

**Для MVP используем концептуальную модель:**

**Priority \=**

**Goal Relevance**

**×**

**Skill Gap**

**×**

**Evidence Need**

**×**

**Time Sensitivity**

**×**

**Expected Impact**

**Это не обязательная финальная формула.**

**Она определяет архитектурную логику.**

---

# **9\. Goal Relevance**

**Насколько Skill важен для Active Goal.**

**Например:**

**Interview Speaking → Very High**

**Professional Vocabulary → High**

**General Poetry Reading → Low**

**Даже если Poetry Reading имеет большой gap, Decision Engine не должен отдавать ему приоритет.**

---

# **10\. Skill Gap**

**Насколько текущая способность отстаёт от требуемой.**

**Required:**

**Functional**

**Current:**

**Basic**

**→ meaningful gap**

---

# **11\. Evidence Need**

**Иногда проблема не в слабом Skill.**

**Проблема:**

> **система не знает, насколько Skill развит.**

**Например:**

**Speaking:**

**Estimate \= Developing**

**Confidence \= Low**

**В этом случае лучшая Recommendation может быть:**

> **diagnostic activity**

**а не ещё один урок.**

---

# **12\. Time Sensitivity**

**Deadline меняет приоритет.**

**Например:**

**Deadline:**

**3 months**

**vs**

**Deadline:**

**10 days**

**Во втором случае система должна сильнее фокусироваться на Skills, непосредственно связанных с Goal.**

---

# **13\. Expected Impact**

**Некоторые Activities могут дать больше результата за то же время.**

**Например:**

> **10 минут contextual vocabulary practice**

**может быть полезнее:**

> **10 минут generic grammar exercises.**

**Decision Engine должен учитывать ожидаемый Learning ROI.**

---

# **14\. Candidate Missions**

**После определения приоритетного Skill Engine создаёт список потенциальных Mission.**

**Например:**

**Skill:**

**Interview Speaking**

**Candidates:**

**A. Practice self-introduction**

**B. Practice behavioral questions**

**C. Learn interview vocabulary**

**D. Listening simulation**

---

# **15\. Mission Ranking**

**Кандидаты ранжируются по:**

* **Skill relevance;**  
* **expected learning impact;**  
* **evidence value;**  
* **time fit;**  
* **difficulty;**  
* **recency.**

---

# **16\. Time Fit**

**Если:**

> **Available Time \= 10 min**

**Mission на:**

> **30 min**

**не должна быть основной рекомендацией.**

**Система может:**

* **сократить Mission;**  
* **выбрать другую;**  
* **предложить продолжить позже.**

---

# **17\. Difficulty**

**Mission не должна быть:**

* **слишком лёгкой;**  
* **слишком сложной.**

**Идея:**

> **productive challenge.**

**Пользователь должен испытывать умеренное затруднение, но иметь разумный шанс успешно выполнить задачу.**

---

# **18\. Recent Activity**

**Decision Engine должен учитывать недавние действия.**

**Например:**

**пользователь только что сделал:**

> **Vocabulary Mission.**

**Не стоит сразу снова предлагать:**

> **тот же vocabulary drill,**

**если нет сильной причины.**

---

# **19\. Variety**

**Разнообразие не является самоцелью.**

**Но повторение одного типа Activity слишком долго может:**

* **снижать engagement;**  
* **создавать узкое Evidence;**  
* **ухудшать transfer.**

**Поэтому Engine может учитывать:**

> **Activity diversity.**

---

# **20\. Recommendation Types**

**MVP поддерживает несколько типов следующего действия.**

### **Learn**

**Получить новое знание.**

### **Practice**

**Отработать существующий Skill.**

### **Apply**

**Использовать Skill в контексте.**

### **Review**

**Повторить ранее изученное.**

### **Diagnose**

**Получить дополнительное Evidence.**

### **Reflect**

**Попросить пользователя оценить трудность / результат.**

---

# **21\. Recommendation Decision**

**Decision Engine выбирает не обязательно:**

> **«урок».**

**Он выбирает:**

> **следующий learning action.**

**Например:**

**Confidence low**

**↓**

**Diagnose**

**Confidence medium \+ gap high**

**↓**

**Practice**

**Skill strong \+ Goal critical**

**↓**

**Apply / Simulate**

---

# **22\. Mission Generation**

**После принятия решения AI может сформировать конкретную Mission.**

**Например:**

**Decision:**

**Practice interview speaking**

**AI generates:**

**Mission:**

**“Tell me about a challenging project.”**

**Важно:**

> **AI генерирует содержание после принятия решения.**

---

# **23\. Decision Before Generation**

**Архитектурный pipeline:**

**Decision Engine**

**↓**

**What should user practice?**

**↓**

**AI**

**↓**

**How should this practice be presented?**

**Не наоборот.**

---

# **24\. Structured Decision**

**Decision Engine должен возвращать структурированный объект.**

**Например:**

**Decision {**

    **type**

    **skillId**

    **reason**

    **priority**

    **estimatedDuration**

    **missionType**

**}**

---

# **25\. Explanation**

**Каждая Recommendation должна иметь внутреннее объяснение.**

**Например:**

> **We recommend interview speaking because it is highly relevant to your goal and currently has the largest actionable gap.**

**Пользователь может увидеть сокращённую версию:**

> **Why this?**

> **Speaking is currently your biggest priority for this goal.**

---

# **26\. Explainability**

**Не нужно показывать:**

> **Priority \= 0.7821.**

**Нужно показывать:**

> **This will help you prepare for the situations you said matter most.**

---

# **27\. Decision Confidence**

**Engine должен учитывать собственную уверенность.**

**Например:**

**High confidence:**

**clear Skill gap**

**Low confidence:**

**insufficient Evidence**

**При низкой уверенности лучше выбрать:**

> **diagnostic action.**

---

# **28\. No Decision**

**Иногда системе не хватает данных.**

**Тогда:**

**No reliable recommendation**

**↓**

**Ask clarification**

**или:**

> **Run diagnostic.**

**Система не должна генерировать случайную Mission только потому, что пользователь открыл приложение.**

---

# **29\. Daily Recommendation**

**Для MVP Home показывает:**

> **One Best Next Action**

**Например:**

> **Practice answering “Tell me about yourself.”**

**Это снижает cognitive load.**

---

# **30\. Recommendation Queue**

**Можно иметь внутреннюю очередь:**

**Now**

**↓**

**Next**

**↓**

**Later**

**Но пользователь не обязан видеть длинный curriculum.**

---

# **31\. Why One Action**

**Большое количество вариантов:**

> **Choose from 27 lessons.**

**перекладывает decision cost на пользователя.**

**LOS должен выполнять работу:**

> **recommendation, not content dumping.**

---

# **32\. User Override**

**Пользователь всегда может сказать:**

> **Not now.**

**или:**

> **I want to practice speaking.**

**Это User Agency.**

**Engine должен принять override.**

---

# **33\. User Override ≠ State Change**

**Если пользователь выбрал другую Activity:**

> **это не означает, что система должна изменить Skill Priority.**

**Мы разделяем:**

**System Recommendation**

**vs**

**User Choice**

---

# **34\. Manual Choice**

**Если пользователь хочет:**

> **Practice vocabulary**

**Engine позволяет это сделать.**

**После Activity Evidence всё равно поступает в Learning State.**

---

# **35\. Recommendation Feedback**

**После Mission пользователь может ответить:**

> **Too easy**

> **Too difficult**

> **Useful**

> **Not relevant**

**Эти данные можно использовать как дополнительные сигналы.**

**Но:**

> **user feedback ≠ direct proof of learning.**

---

# **36\. Adaptive Loop**

**Полный цикл:**

**Goal**

**↓**

**Decision**

**↓**

**Mission**

**↓**

**Activity**

**↓**

**Evidence**

**↓**

**Learning State**

**↓**

**Decision**

**Это и есть core loop продукта.**

---

# **37\. Example**

### **Goal**

> **Pass an English job interview in 6 weeks.**

### **Current State**

**Speaking — Developing / High**

**Vocabulary — Basic / Medium**

**Listening — Functional / High**

### **Decision**

**Vocabulary has high relevance and actionable gap.**

### **Mission**

> **Practice professional vocabulary through interview questions.**

### **Evidence**

**User correctly uses target vocabulary but struggles with spontaneous recall.**

### **Updated State**

**Vocabulary:**

> **Basic → Developing**

**Confidence:**

> **Medium → High**

### **Next Decision**

> **Apply vocabulary in spontaneous speaking.**

---

# **38\. Decision Engine and Cost**

**Для нашего MVP Decision Engine должен быть максимально дешёвым.**

**Не используем LLM для каждого decision.**

**Архитектура:**

**Structured State**

**↓**

**Rule-based ranking**

**↓**

**Decision**

**LLM используется там, где требуется semantic reasoning.**

---

# **39\. Где нужен LLM**

**LLM полезен для:**

* **Goal interpretation;**  
* **Skill mapping;**  
* **open-ended evaluation;**  
* **Mission generation;**  
* **feedback generation.**

**Но не обязательно использовать LLM для:**

* **sorting Skills;**  
* **checking available time;**  
* **selecting among predefined mission templates;**  
* **updating deterministic counters;**  
* **basic priority calculations.**

---

# **40\. Cost Architecture**

**User Input**

**↓**

**LLM only when semantic understanding required**

**↓**

**Structured Data**

**↓**

**Cheap deterministic logic**

**↓**

**Decision**

**↓**

**LLM only when content generation required**

**Это соответствует нашей цели:**

> **один founder \+ AI \+ минимальный бюджет.**

---

# **41\. What MVP Does NOT Build**

**Не строим:**

* **reinforcement learning;**  
* **complex ML recommender;**  
* **personalized neural model;**  
* **multi-agent decision system;**  
* **real-time adaptive curriculum optimizer;**  
* **full knowledge graph reasoning.**

---

# **42\. Product Decisions**

### **MVP-9.01**

**Decision Engine отвечает за выбор следующего learning action.**

### **MVP-9.02**

**Decision Engine работает на основании Goal, Learning State, Evidence и Constraints.**

### **MVP-9.03**

**Skill Gap не является единственным критерием.**

### **MVP-9.04**

**Goal Relevance является обязательным фактором.**

### **MVP-9.05**

**Недостаток Evidence может привести к диагностической Recommendation.**

### **MVP-9.06**

**Recommendation должна учитывать Available Time.**

### **MVP-9.07**

**Recommendation должна учитывать Deadline.**

### **MVP-9.08**

**Engine должен учитывать recent activity.**

### **MVP-9.09**

**Decision Engine выбирает learning action, а не просто content item.**

### **MVP-9.10**

**AI генерирует контент после принятия решения.**

### **MVP-9.11**

**Recommendation имеет объяснение.**

### **MVP-9.12**

**Пользователь может override Recommendation.**

### **MVP-9.13**

**Основной Home CTA — одна Best Next Action.**

### **MVP-9.14**

**Основная логика ranking должна быть deterministic/rule-based.**

### **MVP-9.15**

**LLM используется только там, где действительно требуется semantic reasoning.**

---

# **43\. Assumptions**

* **Rule-based ranking будет достаточно хорош для MVP.**  
* **Goal relevance и Skill gap дадут полезную первичную персонализацию.**  
* **Короткий learning horizon проще оптимизировать.**  
* **Пользователю полезнее одна рекомендация, чем каталог вариантов.**  
* **AI-generated Missions будут достаточно качественными при наличии структурированного Decision.**

---

# **44\. Risks**

### **Bad Goal Mapping**

**Ошибочная декомпозиция Goal приведёт к неправильным Recommendations.**

### **Poor Evidence**

**Некачественная оценка создаст неправильный priority.**

### **Recommendation Fatigue**

**Пользователь может начать игнорировать рекомендации.**

### **Over-optimization**

**Engine может слишком сильно оптимизировать measurable Skills.**

### **Lack of Variety**

**Система может слишком часто выбирать один тип Activity.**

---

# **45\. Alternatives Considered**

### **AI decides everything**

**Отвергнуто.**

**Слишком дорого и непредсказуемо.**

### **User chooses every lesson**

**Отвергнуто.**

**Это разрушает основную ценность LOS.**

### **Fixed Curriculum**

**Отвергнуто.**

**Не соответствует continuous adaptation.**

### **Feed of Recommendations**

**Отложено.**

**MVP должен проверять одну Best Next Action.**

---

# **46\. Dependencies**

**Зависит от:**

* **Goal Model;**  
* **Learning State;**  
* **Evidence;**  
* **Skill Model;**  
* **Mission Model.**

**Влияет на:**

* **Home;**  
* **Mission;**  
* **Activity;**  
* **AI generation;**  
* **analytics;**  
* **mascot progression.**

---

# **47\. Open Questions**

### **1\. Нужно ли делать полноценный ranking algorithm в MVP?**

**Recommendation: нет.**

**Начать с weighted rules и нескольких понятных приоритетов.**

### **2\. Нужно ли использовать LLM для сложных конфликтов?**

**Recommendation: только если deterministic rules не могут принять решение.**

### **3\. Должен ли пользователь видеть альтернативы?**

**Recommendation: основной UI — одна рекомендация.**

**Дополнительная возможность:**

> **Choose something else**

---

# **48\. Acceptance Criteria**

* **Определены inputs Decision Engine.**  
* **Определён Skill prioritization.**  
* **Учитывается Goal Relevance.**  
* **Учитывается Skill Gap.**  
* **Учитывается Evidence Confidence.**  
* **Учитываются Deadline и Available Time.**  
* **Учитывается Recent Activity.**  
* **Поддерживаются Diagnose / Practice / Apply / Review.**  
* **Recommendation имеет explanation.**  
* **User Override поддерживается.**  
* **Decision Engine не зависит от LLM для каждого решения.**  
* **AI generation происходит после decision.**  
* **Core loop работает end-to-end.**

---

# **49\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Decision Before Generation** | **✅** |
| **Evidence Before Assumption** | **✅** |
| **Continuous Adaptation** | **✅** |
| **Learning ROI** | **✅** |
| **Explainable Intelligence** | **✅** |
| **Cost Awareness** | **✅** |
| **User Agency** | **✅** |
| **AI as Execution Layer** | **✅** |
| **Founder \+ AI Buildability** | **✅** |

---

## **Итог**

**Мы зафиксировали центральное правило продукта:**

> **AI не должен постоянно придумывать пользователю, чем заняться. Система сначала принимает образовательное решение, а AI затем помогает реализовать это решение.**

**Архитектура:**

                **ACTIVE GOAL**

                     **↓**

              **REQUIRED SKILLS**

                     **↓**

              **LEARNING STATE**

                     **↓**

                  **EVIDENCE**

                     **↓**

              **DECISION ENGINE**

                     **↓**

           **ONE BEST NEXT ACTION**

                     **↓**

                  **MISSION**

                     **↓**

                 **ACTIVITY**

                     **↓**

                  **EVIDENCE**

                     **↺**

**Именно этот цикл отличает наше приложение от:**

* **библиотеки учебных материалов;**  
* **AI-чат-репетитора;**  
* **генератора упражнений;**  
* **обычного language-learning app.**

# **II. LEARNING & AI**

# **10\. MVP Mission Model**

## **1\. Цель**

**Определить, что такое Mission в MVP, из чего она состоит, как создаётся и как связывает Decision Engine с конкретным обучающим действием пользователя.**

**Mission — это не урок и не набор случайных упражнений.**

> **Mission — это короткая целенаправленная учебная сессия, созданная для изменения или проверки конкретного Skill State относительно Active Goal.**

---

# **2\. Контекст**

**Мы уже зафиксировали:**

**Goal**

**↓**

**Learning State**

**↓**

**Evidence**

**↓**

**Decision Engine**

**↓**

**Next Learning Action**

**Mission является следующим уровнем:**

**Decision**

**↓**

**Mission**

**↓**

**Activities**

**↓**

**Evidence**

---

# **3\. Зачем нужна Mission**

**Decision Engine может решить:**

> **Improve interview speaking.**

**Но пользователю нужен конкретный опыт:**

> **что делать прямо сейчас?**

**Mission переводит абстрактное решение в понятную задачу.**

**Например:**

> **Practice talking about your previous work experience.**

---

# **4\. Mission не является уроком**

**Классический урок:**

> **Present Perfect**

**Mission:**

> **Tell an interviewer what you have achieved in your previous job.**

**Грамматика может появиться внутри Mission, если она нужна для выполнения задачи.**

---

# **5\. Mission не является Goal**

**Goal:**

> **Pass an English job interview.**

**Mission:**

> **Practice answering questions about previous experience.**

**Goal — долгосрочное направление.**

**Mission — ближайший шаг.**

---

# **6\. Mission не является Activity**

**Mission:**

> **Practice answering behavioral interview questions.**

**Activities:**

1. **Review useful expressions.**  
2. **Listen to an example.**  
3. **Answer a question.**  
4. **Receive feedback.**  
5. **Try again.**

**Mission объединяет Activities вокруг одной цели.**

---

# **7\. Mission Object**

**Минимальная модель:**

**Mission**

**│**

**├── id**

**├── goal\_id**

**├── primary\_skill**

**├── secondary\_skills**

**├── objective**

**├── type**

**├── estimated\_duration**

**├── difficulty**

**├── activities**

**├── success\_criteria**

**└── status**

---

# **8\. Mission Objective**

**Каждая Mission должна иметь один основной Objective.**

**Хорошо:**

> **Practice explaining previous work experience.**

**Плохо:**

> **Learn vocabulary, grammar, listening, writing and interview skills.**

**Слишком много целей.**

---

# **9\. Primary Skill**

**Mission должна иметь:**

> **один Primary Skill.**

**Например:**

**Primary:**

**Interview Speaking**

**Secondary:**

**Professional Vocabulary**

**Это помогает Decision Engine понять, какое Evidence ожидается.**

---

# **10\. Secondary Skills**

**Secondary Skills допустимы.**

**Но они не должны размывать Mission.**

**Например:**

> **Primary: Speaking**  
> **Secondary: Vocabulary**

**Это естественная комбинация.**

---

# **11\. Mission Types**

**MVP поддерживает:**

### **Learn**

**Получить новое знание.**

### **Practice**

**Отработать Skill.**

### **Apply**

**Использовать Skill в контексте.**

### **Review**

**Повторить ранее изученное.**

### **Diagnose**

**Проверить состояние Skill.**

### **Simulate**

**Выполнить реалистичную коммуникационную задачу.**

---

# **12\. Mission Type Selection**

**Decision Engine выбирает тип.**

**Например:**

**Low confidence**

**→ Diagnose**

**High gap**

**→ Learn / Practice**

**Knowledge exists**

**\+**

**Need transfer**

**→ Apply**

**Goal situation important**

**\+**

**Skill sufficiently developed**

**→ Simulate**

---

# **13\. Mission Duration**

**MVP должен поддерживать короткие Mission.**

**Рекомендуемый диапазон:**

> **5–20 минут.**

**Основной default:**

> **10–15 минут.**

**Это соответствует:**

* **mobile usage;**  
* **variable schedule;**  
* **Available Time;**  
* **низкому барьеру входа.**

---

# **14\. Mission Must Fit Available Time**

**Если пользователь указал:**

> **15 min/day**

**Mission на:**

> **12 min**

**подходит.**

**Mission на:**

> **40 min**

**не должна быть основной рекомендацией.**

---

# **15\. Mission Difficulty**

**Используем простые уровни:**

**Easy**

**Moderate**

**Challenging**

**Difficulty определяется относительно:**

* **Skill State;**  
* **Goal requirement;**  
* **Activity type.**

---

# **16\. Productive Difficulty**

**Mission должна находиться в зоне:**

> **сложно, но выполнимо.**

**Слишком лёгкая Mission:**

* **не даёт нового Evidence;**  
* **снижает learning value.**

**Слишком сложная:**

* **создаёт frustration;**  
* **даёт плохое Evidence о реальной способности.**

---

# **17\. Mission Structure**

**Базовая структура:**

**Mission Intro**

**↓**

**Activity 1**

**↓**

**Activity 2**

**↓**

**Activity 3**

**↓**

**Feedback**

**↓**

**Mission Result**

**Количество Activities может быть меньше или больше.**

---

# **18\. Mission Intro**

**Пользователь должен понимать:**

### **What**

**Что мы будем делать?**

### **Why**

**Почему это важно?**

### **Time**

**Сколько займёт?**

**Например:**

> **Practice answering common interview questions.**

> **This will help you build confidence in professional speaking.**

> **\~10 min**

---

# **19\. Activities Inside Mission**

**Activities должны образовывать последовательность.**

**Например:**

**Context**

**↓**

**Input**

**↓**

**Practice**

**↓**

**Production**

**↓**

**Feedback**

**↓**

**Retry**

**Не обязательно использовать все этапы каждый раз.**

---

# **20\. Mission Success Criteria**

**Mission должна иметь observable criteria.**

**Например:**

> **Successfully answer two interview questions using relevant vocabulary.**

**Не:**

> **Finish all exercises.**

---

# **21\. Completion vs Success**

**Это разные состояния.**

### **Completion**

**Пользователь дошёл до конца Mission.**

### **Success**

**Пользователь продемонстрировал требуемую performance.**

**Это принципиально для Evidence.**

---

# **22\. Mission Result**

**После завершения:**

**Mission Complete**

**You practiced:**

**Interview speaking**

**You demonstrated:**

**Clear answers about your experience**

**Still developing:**

**Professional vocabulary**

**Next:**

**Practice spontaneous answers**

---

# **23\. Evidence Generated by Mission**

**Mission должна быть спроектирована с пониманием:**

> **какое Evidence она должна получить.**

**Например:**

**Mission**

**↓**

**Expected Evidence**

**↓**

**Activity design**

**Это важный architectural principle.**

**Мы не сначала генерируем упражнения, а потом пытаемся понять, что они измеряют.**

---

# **24\. Evidence Before Activity Generation**

**Правильный flow:**

**Skill**

**↓**

**Evidence needed**

**↓**

**Mission objective**

**↓**

**Activity design**

**↓**

**AI generation**

---

# **25\. Mission Templates**

**Чтобы снизить стоимость и повысить качество, MVP использует templates.**

**Например:**

### **Speaking Practice**

**↓**

**Prompt**

**↓**

**User response**

**↓**

**AI feedback**

**↓**

**Retry**

### **Vocabulary**

**↓**

**Recall**

**↓**

**Use in sentence**

**↓**

**Contextual production**

### **Listening**

**↓**

**Comprehension**

**↓**

**Answer**

**↓**

**Feedback**

---

# **26\. Почему Templates важнее полностью свободной генерации**

**Если каждый раз просить AI:**

> **«Придумай урок английского»**

**получим:**

* **непредсказуемую структуру;**  
* **разное качество;**  
* **сложный QA;**  
* **высокую стоимость;**  
* **проблемы с Evidence.**

**Template задаёт:**

> **образовательную архитектуру.**

**AI заполняет её содержанием.**

---

# **27\. AI Role**

**AI может:**

* **генерировать prompts;**  
* **выбирать примеры;**  
* **создавать contextual content;**  
* **адаптировать difficulty;**  
* **оценивать responses;**  
* **генерировать feedback.**

**Но:**

> **Mission structure должна контролироваться приложением.**

---

# **28\. Mission Generation Pipeline**

**Decision Engine**

**↓**

**Mission Template**

**↓**

**Context \+ Skill \+ Goal**

**↓**

**AI Content Generation**

**↓**

**Validation**

**↓**

**Mission**

**↓**

**User**

---

# **29\. Validation**

**AI-generated Mission должна проходить базовую проверку:**

* **соответствует Goal;**  
* **соответствует Skill;**  
* **соответствует target language;**  
* **подходит по времени;**  
* **имеет ожидаемый Evidence;**  
* **не содержит очевидных ошибок.**

---

# **30\. Fallback**

**Если AI не смог создать Mission:**

> **система использует заранее подготовленный template / material.**

**Пользователь не должен видеть:**

> **AI generation failed.**

**Вместо этого:**

> **Let's try another activity.**

---

# **31\. Mission Personalization**

**Персонализация происходит через:**

**Goal**

**\+**

**Skill**

**\+**

**Learning State**

**\+**

**Recent Evidence**

**\+**

**Available Time**

**Например два пользователя получают разные Missions:**

### **User A**

**Speaking Basic**

**→ controlled speaking.**

### **User B**

**Speaking Functional**

**→ spontaneous simulation.**

---

# **32\. Mission Repetition**

**Повтор Mission допустим.**

**Но повтор не должен быть простым клонированием.**

**Например:**

**Mission 1:**

**Tell me about your previous job.**

**Mission 2:**

**Tell me about a difficult project.**

**Mission 3:**

**Explain how you solved a problem.**

**Skill тот же.**

**Context меняется.**

---

# **33\. Transfer**

**Mission должна постепенно переносить Skill:**

**Controlled**

**↓**

**Contextual**

**↓**

**Open-ended**

**↓**

**Simulation**

**Это особенно важно для goal-oriented learning.**

---

# **34\. Mission Completion Behaviour**

**После Mission:**

**Performance**

**↓**

**Evidence**

**↓**

**Learning State Update**

**↓**

**Decision**

**↓**

**Next Mission**

**Пользователь возвращается на Home.**

---

# **35\. Mission History**

**MVP должен сохранять:**

* **completed Missions;**  
* **performance;**  
* **Evidence;**  
* **timestamp.**

**Но History не должна быть центральным интерфейсом.**

---

# **36\. Mission Cancellation**

**Пользователь может выйти.**

**Статус:**

> **Abandoned.**

**Это не является негативным Learning Evidence.**

---

# **37\. Resume**

**Для MVP желательно поддерживать:**

> **Resume Mission.**

**Если пользователь закрыл приложение в середине.**

**Это снижает friction.**

---

# **38\. Mission Failure**

**Не используем язык:**

> **Failed.**

**Лучше:**

> **Let's try another approach.**

**Пользователь не должен чувствовать, что его Goal «провалена».**

---

# **39\. User Feedback**

**После Mission можно задать очень короткий вопрос:**

> **How did this feel?**

**Options:**

* **Too easy**  
* **Right level**  
* **Too difficult**

**Это дополнительный signal.**

---

# **40\. Difficulty Adaptation**

**Если пользователь регулярно сообщает:**

> **Too easy**

**Decision Engine может увеличить difficulty.**

**Если:**

> **Too difficult**

**может:**

* **уменьшить complexity;**  
* **добавить scaffolding;**  
* **выбрать более controlled Activity.**

---

# **41\. Mission and Mascot**

**Mascot может реагировать на:**

> **Mission completion**

**но значительный growth должен зависеть от:**

> **meaningful Evidence / milestone.**

**Таким образом:**

**Mission completed**

**→ small interaction**

**Skill milestone**

**→ meaningful growth**

---

# **42\. Product Decisions**

### **MVP-10.01**

**Mission является короткой целенаправленной учебной сессией.**

### **MVP-10.02**

**Mission имеет один Primary Skill.**

### **MVP-10.03**

**Mission может иметь Secondary Skills.**

### **MVP-10.04**

**Mission имеет observable Objective.**

### **MVP-10.05**

**Completion и Success разделены.**

### **MVP-10.06**

**Mission должна быть связана с ожидаемым Evidence.**

### **MVP-10.07**

**Mission создаётся после Decision Engine.**

### **MVP-10.08**

**AI генерирует содержание внутри контролируемого Template.**

### **MVP-10.09**

**MVP использует Mission Templates.**

### **MVP-10.10**

**Mission обычно занимает 5–20 минут.**

### **MVP-10.11**

**Mission должна соответствовать Available Time.**

### **MVP-10.12**

**Difficulty адаптируется относительно Skill State.**

### **MVP-10.13**

**Mission может повторяться с новым контекстом.**

### **MVP-10.14**

**Mission поддерживает Apply и Simulation, а не только drills.**

### **MVP-10.15**

**Mission completion не считается автоматически Evidence of learning.**

---

# **43\. Assumptions**

* **Короткие Mission лучше подходят мобильному использованию.**  
* **Templates обеспечат более стабильное качество AI-generated learning.**  
* **Mission-oriented learning будет понятнее пользователю, чем традиционные lessons.**  
* **Контекстная практика даст более полезное Evidence.**  
* **5–20 минут достаточно для meaningful learning action.**

---

# **44\. Risks**

### **Template Repetition**

**Пользователь может почувствовать однообразие.**

### **AI Content Quality**

**AI может генерировать слабые задания.**

### **Mission Overengineering**

**Слишком сложные Mission увеличат стоимость разработки.**

### **Evidence Misalignment**

**Activity может не измерять заявленный Skill.**

### **Time Estimation Error**

**AI может неправильно оценить продолжительность.**

---

# **45\. Alternatives Considered**

### **Lesson-based Architecture**

**Отвергнуто.**

**Mission лучше соответствует adaptive learning.**

### **Fully AI-generated Sessions**

**Отвергнуто.**

**Слишком непредсказуемо.**

### **Single Activity \= Mission**

**Отложено.**

**Иногда полезно, но Mission как контейнер даёт больше flexibility.**

### **Long Courses**

**Отвергнуто для MVP.**

---

# **46\. Dependencies**

**Зависит от:**

* **Decision Engine;**  
* **Learning State;**  
* **Evidence Model;**  
* **Activity Model;**  
* **AI generation.**

**Влияет на:**

* **Home;**  
* **Activity;**  
* **Mission Result;**  
* **Mascot;**  
* **cost;**  
* **analytics.**

---

# **47\. Open Questions**

### **1\. Сколько Activity должно быть внутри Mission?**

**Recommendation: 1–5.**

**Не фиксировать одно значение.**

### **2\. Нужно ли давать пользователю возможность пропустить Activity?**

**Recommendation: да.**

**Но если Activity является критическим Evidence step, система должна объяснить последствия.**

### **3\. Нужна ли отдельная Mission Library?**

**Recommendation: нет.**

**Missions должны приходить через Decision Engine.**

---

# **48\. Acceptance Criteria**

* **Определена Mission сущность.**  
* **Определён Primary Skill.**  
* **Определены Mission Types.**  
* **Определены Objectives.**  
* **Определены Success Criteria.**  
* **Completion отделено от Success.**  
* **Mission связана с Evidence.**  
* **Определены Templates.**  
* **Определена роль AI.**  
* **Поддерживается personalization.**  
* **Поддерживается difficulty adaptation.**  
* **Поддерживается повторение с новым контекстом.**  
* **Mission соответствует Available Time.**  
* **Core Mission loop работает end-to-end.**

---

# **49\. Architecture Check**

| Принцип | Статус |
| ----- | ----- |
| **Goal Before Content** | **✅** |
| **Evidence Before Activity** | **✅** |
| **Decision Before Generation** | **✅** |
| **Continuous Adaptation** | **✅** |
| **Learning ROI** | **✅** |
| **AI as Execution Layer** | **✅** |
| **Template-first AI** | **✅** |
| **Cost Awareness** | **✅** |
| **User Agency** | **✅** |
| **Mobile-first** | **✅** |

---

## **Итог**

**Мы зафиксировали важное отличие продукта:**

> **Mission — это не контент. Это контейнер для достижения конкретного образовательного результата.**

**Архитектура:**

**Goal**

  **↓**

**Skill Gap**

  **↓**

**Decision**

  **↓**

**Mission Objective**

  **↓**

**Expected Evidence**

  **↓**

**Mission Template**

  **↓**

**AI-generated Content**

  **↓**

**Activities**

  **↓**

**Performance**

  **↓**

**Evidence**

**Именно такой подход позволяет нам использовать AI там, где он действительно полезен, но не отдавать ему управление архитектурой обучения.**

