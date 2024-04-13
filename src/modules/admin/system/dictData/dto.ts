import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { keyStr } from './config';

export class PageDto$Dict {
  @ApiProperty({
    description: '当前页包含数量',
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly pageSize: number = 10;

  @ApiProperty({
    description: '当前页包含数量',
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly pageNum: number = 1;

  @ApiProperty({
    description: 'dictType',
    required: false,
  })
  @Type(() => String)
  @IsString()
  readonly dictType: string = '';
}

export class InfoDto$Dict {
  @ApiProperty({
    description: 'id',
  })
  @IsString()
  id: string;
}
