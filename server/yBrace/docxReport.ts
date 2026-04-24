import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { YBraceReport } from './report';

function textRun(text: string, bold = false): TextRun {
  return new TextRun({
    text,
    bold,
    size: 24,
    font: {
      ascii: 'Times New Roman',
      eastAsia: 'SimSun',
      hint: 'eastAsia',
    },
  });
}

function paragraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [textRun(text, bold)],
    spacing: { after: 120 },
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}

export async function buildYBraceDocxBuffer(report: YBraceReport): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: report.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    paragraph(`生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN', { hour12: false })}`),
    heading('1. 计算参数'),
    ...report.parameters.map((line) => paragraph(line)),
  ];

  report.sections.forEach((section, index) => {
    children.push(heading(`${index + 2}. ${section.title}`));
    section.lines.forEach((line) => children.push(paragraph(line)));
  });

  children.push(
    heading('结论'),
    paragraph(report.conclusion.message, true),
  );

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: 24,
            font: {
              ascii: 'Times New Roman',
              eastAsia: 'SimSun',
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 36, bold: true, font: 'SimHei' },
          paragraph: { spacing: { before: 240, after: 240 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, font: 'SimHei' },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(document);
}
