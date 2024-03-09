import {
  PartialUserObjectResponse,
  RichTextItemResponse,
  UserObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

/**
 * 模拟 Notion 未导出的类型
 */
type MockingSelectProperty = {
  id: string;
  name: string;
  color: string;
};
type MockingDateProperty = {
  start: string;
  end: string | null;
  time_zone: TimeZoneRequest | null;
};
type StringFormulaPropertyResponse = {
  type: 'string';
  string: string | null;
};
type DateFormulaPropertyResponse = {
  type: 'date';
  date: DateResponse | null;
};
type NumberFormulaPropertyResponse = {
  type: 'number';
  number: number | null;
};
type BooleanFormulaPropertyResponse = {
  type: 'boolean';
  boolean: boolean | null;
};
type MockingFormulaPropertyResponse =
  | StringFormulaPropertyResponse
  | DateFormulaPropertyResponse
  | NumberFormulaPropertyResponse
  | BooleanFormulaPropertyResponse;

export type PagePropertyTypeMap = keyof PageProperties;
export type PagePropertySchema<T extends PagePropertyTypeMap> = PageProperties[T];

/**
 * 模拟 Notion 的页面属性类型
 * 来源：@notionhq/client/build/src/api-endpoints.d.ts
 * 不支持的类型：rollup, verification
 */
export type PageProperties = {
  number: {
    type: 'number';
    number: number | null;
    id: string;
  };
  select: {
    type: 'select';
    select: MockingSelectProperty | null;
    id: string;
  };
  multi_select: {
    type: 'multi_select';
    multi_select: Array<MockingSelectProperty>;
    id: string;
  };
  url: {
    type: 'url';
    url: string | null;
    id: string;
  };
  status: {
    type: 'status';
    status: MockingSelectProperty | null;
    id: string;
  };
  date: {
    type: 'date';
    date: MockingDateProperty | null;
    id: string;
  };
  email: {
    type: 'email';
    email: string | null;
    id: string;
  };
  phone_number: {
    type: 'phone_number';
    phone_number: string | null;
    id: string;
  };
  checkbox: {
    type: 'checkbox';
    checkbox: boolean;
    id: string;
  };
  files: {
    type: 'files';
    files: Array<
      | {
          file: {
            url: string;
            expiry_time: string;
          };
          name: string;
          type?: 'file';
        }
      | {
          external: {
            url: 'string';
          };
          name: string;
          type?: 'external';
        }
    >;
    id: string;
  };
  created_by: {
    type: 'created_by';
    created_by: PartialUserObjectResponse | UserObjectResponse;
    id: string;
  };
  created_time: {
    type: 'created_time';
    created_time: string;
    id: string;
  };
  last_edited_by: {
    type: 'last_edited_by';
    last_edited_by: PartialUserObjectResponse | UserObjectResponse;
    id: string;
  };
  last_edited_time: {
    type: 'last_edited_time';
    last_edited_time: string;
    id: string;
  };
  formula: {
    type: 'formula';
    formula: MockingFormulaPropertyResponse;
    id: string;
  };
  unique_id: {
    type: 'unique_id';
    unique_id: {
      prefix: string | null;
      number: number | null;
    };
    id: string;
  };
  title: {
    type: 'title';
    title: Array<RichTextItemResponse>;
    id: string;
  };
  rich_text: {
    type: 'rich_text';
    rich_text: Array<RichTextItemResponse>;
    id: string;
  };
  people: {
    type: 'people';
    people: Array<PartialUserObjectResponse | UserObjectResponse>;
    id: string;
  };
  relation: {
    type: 'relation';
    relation: Array<{
      id: string;
    }>;
    id: string;
  };
};
