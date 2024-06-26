import { HttpException } from '@nestjs/common';
import { ErrorCodeMap, ErrorCodeMapType } from '../contants/error-code.contants';

/**
 * Api业务异常均抛出该异常
 */
export class ApiException extends HttpException {
  /**
   * 业务类型错误代码，非Http code
   */
  private errorCode: ErrorCodeMapType;

  constructor(errorCode: ErrorCodeMapType) {
    super(ErrorCodeMap[errorCode], 200);
    this.errorCode = errorCode;
  }

  getErrorCode(): ErrorCodeMapType {
    return this.errorCode;
  }
}
