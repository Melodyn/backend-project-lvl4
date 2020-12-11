import qs from 'querystring';

const formFieldRegex = new RegExp('data\\[(?<field>.+)\\]');

const extractData = (bodyObject) => Object.entries(bodyObject)
  .reduce((acc, [key, value]) => {
    const formFields = key.match(formFieldRegex);
    if (!formFields) {
      const { data } = acc;
      acc[key] = value;
      acc.data = data;
      return acc;
    }
    acc.data[formFields.groups.field] = value;
    return acc;
  }, { data: {} });

const parser = (body) => extractData(qs.parse(body));

export default parser;
