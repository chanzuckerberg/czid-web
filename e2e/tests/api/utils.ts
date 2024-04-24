// Helper function to split an array into chunks
//  array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], chunkSize = 3
//  returns [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
export const splitArrayIntoChunks = (array: any[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
};
