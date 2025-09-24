import type { EnumExt, TagText, Option, EnumObj } from "@/models";

export const toEnumExtArray = (enumType: object, tagTextArray: Array<TagText>) => {
  return Object.values(enumType).map((item, index) => {
    return {
      value: item,
      text: tagTextArray[index].text,
      tag: tagTextArray[index].tag,
    };
  });
};

/**
 * useEnum
 */
export const useEnum = <T>(arr: Array<EnumExt<T>>): EnumObj<T> => {
  const getTagText = (
    value: T,
    defaultValue: TagText = { text: "无", tag: "primary" },
  ): TagText => {
    return arr.find((item) => item.value == value) || defaultValue;
  };
  const getOptions = (): Array<Option<T>> => {
    const result: Array<Option<T>> = [];
    arr.forEach((item) => {
      result.push({
        label: item.text,
        value: item.value,
      });
    });
    return result;
  };
  const getOpposite = (value: T): T => {
    return arr.find((item) => item.value == value)?.oppositeValue || ("" as any);
  };

  return { getTagText, getOptions, getOpposite };
};

export const useEnum2 = (
  enumType: object,
  tagTextArray: Array<TagText>,
  oppositeList: Array<string> = [],
) => {
  const arr = Object.values(enumType).map((item, index) => {
    return {
      value: item,
      text: tagTextArray[index].text,
      tag: tagTextArray[index].tag,
      oppositeValue: oppositeList[index],
    };
  });
  return useEnum(arr);
};
