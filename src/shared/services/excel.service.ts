import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { join } from 'path';
import * as fs from 'fs';

// https://4sii.tistory.com/693
@Injectable()
export class ExcelService {
  async createExcelFile(prefix: string, data: Array<string | Buffer>) {
    // 파일 작명
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${prefix}_${formattedDate}.xlsx`;

    // temp 임시 폴더 없다면 생성, 있다면 무시
    fs.mkdirSync(join(process.cwd(), `temp`), { recursive: true });
    const filePath = join(process.cwd(), `temp/${filename}`);

    // filePath 위치에 엑셀 다운로드
    const wb = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, newWorksheet, 'Sheet1');
    const wbOptions: any = { bookType: 'xlsx', type: 'binary' };
    XLSX.writeFile(wb, filePath, wbOptions);
    const file = fs.createReadStream(filePath);
    return { filename, filePath, file };
  }
}
