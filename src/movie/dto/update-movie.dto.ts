import {
  IsNotEmpty,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

@ValidatorConstraint({
  async: true,
})
class PasswordValidator implements ValidatorConstraintInterface {
  validate(value: string) {
    return value.length > 4 && value.length < 8;
  }
  defaultMessage() {
    return `Password must be longer than 4 characters and less than 8 characters. input password ($value)`;
  }
}

function IsPasswordValidator(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: PasswordValidator,
    });
  };
}

export class UpdateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // @IsDefined() // null 또는 undefined 인지 검증
  // @Equals('test') // 값이 무조건 test 여야 함
  // @NotEquals('test') // 값이 test가 아니어야 함
  // @IsEmpty() // null 또는 undefined 또는 빈 문자열인지 검증
  // @IsNotEmpty() // null 또는 undefined 또는 빈 문자열이 아닌지 검증
  // @IsIn(['test', 'test2']) // 값이 test 또는 test2 중 하나여야 함
  // @IsNotIn(['test', 'test2']) // 값이 test 또는 test2 중 하나가 아니어야 함
  // @IsBoolean() // 불리언 타입인지 검증
  // @IsString() // 문자열 타입인지 검증
  // @IsNumber() // 숫자 타입인지 검증
  // @IsInt() // 정수 타입인지 검증
  // @IsArray() // 배열 타입인지 검증
  // @IsEnum(MovieGenre) // 값이 열거형 타입 중 하나인지 검증
  // @IsDateString() // 날짜 형식인지 검증
  // @IsDivisibleBy(5) // 값이 숫자로 나누어 떨어지는지 검증
  // @IsNegative() // 값이 음수인지 검증
  // @Max(10) // 값이 10보다 작거나 같은지 검증
  // @Min(10) // 값이 10보다 크거나 같은지 검증
  // @Contains('test') // 값에 test가 포함되어 있는지 검증
  // @NotContains('test') // 값에 test가 포함되어 있지 않은지 검증
  // @IsAlphanumeric() // 값이 알파벳과 숫자로만 이루어져 있는지 검증
  // @IsCreditCard() // 값이 신용카드 번호 형식인지 검증
  // @IsHexColor() // 값이 16진수 색상 형식인지 검증
  // @IsMaxLength(10) // 값의 길이가 10보다 작거나 같은지 검증
  // @IsMinLength(10) // 값의 길이가 10보다 크거나 같은지 검증
  // @IsUUID() // 값이 UUID 형식인지 검증
  // @IsLongitude() // 값이 경도 형식인지 검증
  // @IsLatitude() // 값이 위도 형식인지 검증
  @IsPasswordValidator({ message: 'Password is not valid' })
  test: string;
}
