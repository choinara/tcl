/**
 * 메뉴의 즐겨찾기 상태를 관리하는 커스텀 훅
 *
 * ⚠️  주의: FavoritesProvider로 감싼 컴포넌트 내에서만 사용 가능합니다.
 *
 * 🔄 Context를 통해 전역 상태를 공유하므로, 모든 컴포넌트에서 실시간으로 동기화됩니다.
 *
 * 반환값:
 * - favorites: 현재 즐겨찾기된 메뉴 ID 배열
 * - toggleFavorite(menuId): 특정 메뉴의 즐겨찾기 추가/제거 (모든 컴포넌트에 실시간 반영)
 * - isFavorite(menuId): 특정 메뉴가 즐겨찾기 되어 있는지 확인
 *
 * 사용 예시:
 * const { favorites, toggleFavorite, isFavorite } = useFavorites();
 *
 * // 즐겨찾기 확인
 * if (isFavorite('song-selection-wait')) {
 *   console.log('이미 즐겨찾기 됨');
 * }
 *
 * // 즐겨찾기 토글 (모든 컴포넌트에 즉시 반영됨)
 * toggleFavorite('song-selection-wait');
 *
 * 📌 주의: 모든 menuId는 menuItems.ts의 id와 일치해야 합니다.
 *
 * 📌 Provider 설정: App.tsx 또는 main.tsx에서
 * <FavoritesProvider>
 *   <YourApp />
 * </FavoritesProvider>
 */
export { useFavoritesContext as useFavorites } from '@/shared/context/FavoritesContext';
