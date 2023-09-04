import { type Schema, Validator } from 'jsonschema';
import { isRef, onBeforeMount, ref, watch } from 'vue';
import { type MaybeRef, get } from '@vueuse/core';

export interface SchemaStore {
  name: string
  description: string
  url: string
  fileMatch: string[]
  versions?: string[]
}

export function useJsonSchemaValidation({ json, schemaUrl, schemaData }: { json: MaybeRef<string>; schemaUrl: MaybeRef<string>; schemaData: MaybeRef<string> }) {
  const schemas = ref<SchemaStore[]>([]);
  const schema = ref<Schema | null>(null);
  const errors = ref<string[]>([]);

  onBeforeMount(async () => {
    const catalog = await fetch('https://www.schemastore.org/api/json/catalog.json');
    const catalogJson: { $schemaUrl: string; schemas: SchemaStore[]; version: number } = await catalog.json();
    schemas.value = catalogJson.schemas;
  });

  watch([schemaUrl, json, schemaData].filter(isRef), async () => {
    if (get(schemaUrl) === 'custom') {
      schema.value = JSON.parse(get(schemaData)) as Schema;
      return;
    }
    if (get(schemaUrl)) {
      const response = await fetch(get(schemaUrl));
      const schemaJson = await response.json();
      schema.value = schemaJson;
    }
  }, { immediate: true });

  watch([json, schema].filter(isRef), () => {
    const schemaValue = get(schema);
    const jsonValue = get(json);
    if (schemaValue == null) {
      return;
    }
    if (jsonValue == null) {
      return;
    }
    const validator = new Validator();
    const validationResult = validator.validate(JSON.parse(jsonValue), schemaValue);
    errors.value = validationResult.errors.map(error => error.stack ?? '');
  }, { immediate: true });

  return { schemas, errors };
}
