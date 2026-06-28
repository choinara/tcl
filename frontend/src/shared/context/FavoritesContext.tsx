import {createContext, type ReactNode, useState} from 'react';

/**
 * 즐겨찾기 상태 타입 정의
 *
 * @property favorites - 즐겨찾기된 메뉴 ID 배열
 * @property toggleFavorite - 즐겨찾기 추가/제거 함수
 * @property isFavorite - 특정 메뉴가 즐겨찾기되었는지 확인 함수
 */
interface FavoritesContextType {
    favorites: string[];
    toggleFavorite: (menuId: string) => void;
    isFavorite: (menuId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Re-assign for external hook file access
export { FavoritesContext };

 /**
 * ⚠️  주의사항:
 * - Provider 내에서만 useFavoritesContext() 사용 가능
 * - Provider 외에서 사용하면 에러 발생
 */
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    // Step 1. 상태 관리 (localStorage에서 초기값 로드)
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('menu_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Step 3. 즐겨찾기 토글 함수
    // 하위 컴포넌트에서 호출되면 모든 구독 컴포넌트에 즉시 반영됨
    const toggleFavorite = (menuId: string) => {
        // setFavorites의 함수형 업데이트 사용
        // 이전 state에 기반하여 새로운 state 생성
        setFavorites((prev) => {
            // 이미 즐겨찾기된 경우: 제거
            // 아직 즐겨찾기 안 된 경우: 추가
            const updated = prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId];

            // localStorage에 저장 (영구 보관)
            try {
                localStorage.setItem('menu_favorites', JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save favorites to localStorage:', e);
            }

            // 새로운 state 반환
            // 이 반환값이 favorites 상태가 됨
            // → useFavoritesContext()를 사용하는 모든 컴포넌트 업데이트 ✨
            return updated;
        });
    };

    // Step 4. 특정 메뉴가 즐겨찾기되었는지 확인
    const isFavorite = (menuId: string): boolean => {
        return favorites.includes(menuId);
    };

    // Step 5. Provider로 하위 컴포넌트에 데이터 제공
    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                toggleFavorite,
                isFavorite,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

