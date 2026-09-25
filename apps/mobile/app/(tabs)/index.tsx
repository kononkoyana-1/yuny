import { Redirect } from "expo-router";

/**
 * `/` — вход в приложение после входа в аккаунт. Стартовый экран — «Словарь»
 * (#66, решение владельца): «Сегодня» живёт блоком наверху словаря, отдельной
 * вкладки нет.
 */
export default function IndexRoute() {
  return <Redirect href="/dictionary" />;
}
