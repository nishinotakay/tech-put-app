import {api} from './api'

export type Category = {
  id: string
  name: string
}

export type CategoryIndexResponse = {
  course: {
    id: string
    name: string
  }
  categories: Category[]
}

export async function getCategories (
  courseId: string
):Promise<CategoryIndexResponse> {
  const response = await api.get<CategoryIndexResponse>(
    `/admin/courses/${courseId}/categories`
  )
  return response.data
}

export async function updateCategory(
  courseId: string,
  categoryId: string,
  name: string
): Promise<Category> {
  const response = await api.patch<{ category: Category }>(
    `/admin/courses/${courseId}/categories/${categoryId}`,
    { name }
  )

  return response.data.category
}

export async function createCategory (
  courseId: string,
  name: string
): Promise<Category>{
  const response = await api.post<{category: Category}>(
    `/admin/courses/${courseId}/categories`,
    { name }
  )
  return response.data.category
}

export const deleteCategory = async (courseId: string, categoryId: string): Promise<void> => {
  await api.delete(`/admin/courses/${courseId}/categories/${categoryId}`)
}

export type CategoryArticle = {
  id: string
  title: string
  author: string
  content: string
}

export type CategoryArticleResponse = {
  course: {
    id: string
    name: string
  }
  category: {
    id: string
    name: string
  }
  linkedArticles: CategoryArticle[]
  availableArticles: CategoryArticle[]
}

export async function getCategoryArticles (
  courseId: string,
  categoryId: string
): Promise<CategoryArticleResponse> {
  const response = await api.get<CategoryArticleResponse>(
    `/admin/courses/${courseId}/categories/${categoryId}/articles`
  )
  return response.data
}
