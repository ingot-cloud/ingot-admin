export const useIconsCollection = () => {
  const files = import.meta.glob("@/assets/icons/*.svg", { eager: true });

  return Object.keys(files).map(
    (fileName) =>
      `${import.meta.env.VITE_APP_SYMBOL}:${fileName.substring("/src/assets/icons/".length).replaceAll(".svg", "")}`,
  );
};

// const utilFuns: any = {};
// const files = import.meta.glob("@/assets/icons/*.svg", { eager: true });
// Object.keys(files).forEach((fileName) => {
//   console.log(fileName);
//   const name = fileName.replace(/\.\/|\.svg/g, "");
//   utilFuns[name] = files[fileName].default;
// });

// export default utilFuns;
