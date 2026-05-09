export class GofileUploadError extends Error {
  constructor(message: string, public readonly filePath: string) {
    super(message)
    this.name = 'GofileUploadError'
  }
}

export class GofileVerifyError extends Error {
  constructor(message: string, public readonly assetName: string) {
    super(message)
    this.name = 'GofileVerifyError'
  }
}

export class StoreError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'StoreError'
  }
}
