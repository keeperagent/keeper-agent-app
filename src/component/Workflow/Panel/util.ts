const removeSpecialCharacter = (inputString: string): string => {
  // Define a regular expression pattern to match special characters
  const specialCharsRegex = /[\\/,*^&$#@!()_+[\]{}|;:'"<>=?`~%]/g;

  // Use replace method to remove special characters
  const resultString = inputString.replace(specialCharsRegex, "");
  return resultString;
};

export { removeSpecialCharacter };
