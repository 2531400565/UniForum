declare module 'sanitize-html' {
  interface IOptions {
    allowedTags?: string[] | false;
    allowedAttributes?: Record<string, string[]> | false;
    allowedSchemes?: string[] | false;
    allowedStyles?: Record<string, Record<string, RegExp[]>>;
    transformTags?: Record<string, any>;
    disallowedTagsMode?: string;
    [key: string]: any;
  }
  function sanitizeHtml(html: string, options?: IOptions): string;
  namespace sanitizeHtml {
    function simpleTransform(tag: string, attrs?: Record<string, any>): (tagName: string, attribs: any) => any;
  }
  export = sanitizeHtml;
}
