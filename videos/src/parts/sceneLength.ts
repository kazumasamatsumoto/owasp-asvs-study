import { createContext, useContext } from 'react';

/** 今の場面の長さ（フレーム）。声の長さで決まるので、場面の中の段取りは割合で書く */
export const SceneLength = createContext(150);
export const useSceneLength = () => useContext(SceneLength);
/** 場面の長さの割合をフレームに直す */
export const useAt = () => {
  const len = useSceneLength();
  return (ratio: number) => Math.round(len * ratio);
};
