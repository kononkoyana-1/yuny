import type {
  DictionaryArticle,
  DictionaryArticleRequest,
  DictionarySearchRequest,
  DictionarySearchResponse,
} from "@yuny/shared";

/**
 * Словарь БКРС (TZ.md §11 экран 04, §13 `dictionary-search`). Любая реализация
 * обязана прогнать ответ через `DictionarySearchResponseSchema` из
 * `@yuny/shared` перед возвратом.
 */
export interface DictionaryRepository {
  /**
   * Поиск одним полем: иероглиф, пиньинь или русский перевод. Вид запроса
   * определяет сервер и возвращает в `kind` — клиент его не угадывает.
   */
  search(req: DictionarySearchRequest): Promise<DictionarySearchResponse>;
  /**
   * Статья в листе (словарь 2.0, #79 #80 #84): статья по заголовку и чтению,
   * уровень HSK, состав слова и, у знака, слова с ним. Прогоняется через
   * `DictionaryArticleSchema`.
   */
  article(req: DictionaryArticleRequest): Promise<DictionaryArticle>;
}
