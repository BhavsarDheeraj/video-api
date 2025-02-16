import { Injectable, ArgumentMetadata, PipeTransform, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { VideoDurationValidationPipe } from './video-duration.pipe';


@Injectable()
export class FileValidationPipe implements PipeTransform {
    private maxFileSizeValidator: MaxFileSizeValidator;
    private fileTypeValidator: FileTypeValidator;
    private videoDurationValidator: VideoDurationValidationPipe;

    constructor(private configService: ConfigService) {
        this.maxFileSizeValidator = new MaxFileSizeValidator({ maxSize: 1024 * 1024 * parseInt(this.configService.get<string>('MAX_SIZE_IN_MB')!) });
        this.fileTypeValidator = new FileTypeValidator({ fileType: 'video/mp4' });
        this.videoDurationValidator = new VideoDurationValidationPipe(this.configService);
    }

  async transform(value: any, metadata: ArgumentMetadata) {
        if (!value) {
            throw new BadRequestException('No file uploaded');
        }

        const isSizeValid = this.maxFileSizeValidator.isValid(value);
        if (!isSizeValid) throw new BadRequestException('Invalid size');
        const isTypeValid = await this.fileTypeValidator.isValid(value);
        if (!isTypeValid) throw new BadRequestException('Invalid type');
        await this.videoDurationValidator.transform(value, metadata).catch(err => { throw new BadRequestException(err) });;

        return value;
  }
}