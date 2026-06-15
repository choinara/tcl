import { describe, it, expect } from 'vitest'

/**
 * 기본 환경 테스트 — Vitest 실행 확인용
 */
describe('Test Environment', () => {
  it('vitest가 정상적으로 실행된다', () => {
    expect(1 + 1).toBe(2)
  })

  it('문자열 매칭이 동작한다', () => {
    expect('PeakMate Platform').toContain('PeakMate')
  })

  it('배열 유틸리티가 동작한다', () => {
    const items = [1, 2, 3, 4, 5]
    expect(items.filter(n => n > 3)).toEqual([4, 5])
    expect(items).toHaveLength(5)
  })
})
