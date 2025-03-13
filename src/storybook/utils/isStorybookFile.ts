export const isStorybookFile = (filePath: string) => {
  return !!filePath.match(/\.(stories)\.(j|t)sx?$/);
};
