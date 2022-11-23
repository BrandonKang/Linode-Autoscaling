
export interface IErrorDetail {
	field: string
	reason: string
}

export interface IError {
	code: string
	message: string
	errors?: IErrorDetail[] | null
}

export const HttpError = {
	NoContent: { code: '204', message: 'No Content' },
	BadRequest: { code: '400', message: 'Bad Request' },
	Unauthorized: { code: '401', message: 'Unauthorized' },
	Forbidden: { code: '403', message: 'Forbidden' },
	PreconditionRequired: { code: '428', message: 'Precondition Required' },
	InternalServerError: { code: '500', message: 'Internal Server Error' },
	NotImplemented: { code: '501', message: 'Not Implemented' }
}