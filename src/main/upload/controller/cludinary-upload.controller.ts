import { Controller, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";


@ApiTags('Files Upload')
@Controller('upload-files')
export class CludinaryUploadController {}