import { useContext } from 'react';
import { FavoritesContext } from './FavoritesContext';

/**
 * useFavoritesContext 커스텀 훅
 *
 * FavoritesProvider 내에서만 사용 가능합니다.
 *
 * 반환값:
 * - favorites: 현재 즐겨찾기된 메뉴 ID 배열
 * - toggleFavorite(menuId): 특정 메뉴의 즐겨찾기 추가/제거
 * - isFavorite(menuId): 특정 메뉴가 즐겨찾기 되어 있는지 확인
 *
 * 사용 예시:
 * const { favorites, toggleFavorite, isFavorite } = useFavoritesContext();
 */
export const useFavoritesContext = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error(
            'useFavoritesContext는 FavoritesProvider 내에서만 사용할 수 있습니다.'
        );
    }
    return context;
};
