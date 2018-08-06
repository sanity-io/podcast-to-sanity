const joinCategories = (categoryList, pos) => {
  if(!categoryList) {
    return '';
  }
  if (!categoryList[pos]['itunes:category']) {
    return categoryList[pos].$.text;
  }
  return `${categoryList[pos].$.text} > ${categoryList[pos]['itunes:category'][0].$.text}`;
};

module.exports = joinCategories;
