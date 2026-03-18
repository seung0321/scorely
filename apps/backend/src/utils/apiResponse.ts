import { ApiSuccess } from '@resumate/types'

export function success<T>(data: T, message?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}
