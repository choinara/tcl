import { describe, it, expect } from 'vitest';
import { parseTsv } from '@/components/grid/PeakEditGrid';

describe('parseTsv', () => {
  it('탭 구분 단일 행 파싱', () => {
    expect(parseTsv('a\tb\tc')).toEqual([['a', 'b', 'c']]);
  });

  it('여러 행 LF 줄바꿈 파싱', () => {
    expect(parseTsv('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('CRLF 줄바꿈을 LF로 정규화', () => {
    expect(parseTsv('a\tb\r\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('말미 줄바꿈 한 개는 제거 (엑셀 복사본 패턴)', () => {
    expect(parseTsv('a\tb\n')).toEqual([['a', 'b']]);
  });

  it('빈 셀 유지', () => {
    expect(parseTsv('a\t\tc')).toEqual([['a', '', 'c']]);
    expect(parseTsv('\t\t')).toEqual([['', '', '']]);
  });

  it('따옴표로 감싼 셀 내부 줄바꿈 처리 (엑셀 멀티라인)', () => {
    const input = '"line1\nline2"\tnext';
    expect(parseTsv(input)).toEqual([['line1\nline2', 'next']]);
  });

  it('따옴표로 감싼 셀 내부 탭 처리', () => {
    const input = '"with\ttab"\tnext';
    expect(parseTsv(input)).toEqual([['with\ttab', 'next']]);
  });

  it('이스케이프된 따옴표("") 처리', () => {
    const input = '"He said ""hi"""\tnext';
    expect(parseTsv(input)).toEqual([['He said "hi"', 'next']]);
  });

  it('엑셀 120행 시뮬레이션: 행 수 정확히 파싱', () => {
    const rows = Array.from({ length: 120 }, (_, i) => `id_${i}\tname_${i}`).join('\n');
    const result = parseTsv(rows);
    expect(result).toHaveLength(120);
    expect(result[0]).toEqual(['id_0', 'name_0']);
    expect(result[119]).toEqual(['id_119', 'name_119']);
  });

  it('빈 입력 처리', () => {
    expect(parseTsv('')).toEqual([['']]);
  });

  it('단일 셀 처리', () => {
    expect(parseTsv('single')).toEqual([['single']]);
  });
});
