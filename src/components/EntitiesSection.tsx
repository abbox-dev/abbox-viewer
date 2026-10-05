import {
  invalidEntityFields,
  validEntities,
  validEntityCount,
  validEntityFields,
} from "../ir/entitiesView";
import type { EntitiesField } from "../ir/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { JsonTree } from "./JsonTree";

type EntitiesSectionProps = {
  entities: EntitiesField;
};

export function EntitiesSection({ entities }: EntitiesSectionProps) {
  if (entities.status !== "present") {
    return null;
  }

  const items = validEntities(entities);
  const count = validEntityCount(entities);
  const title = count === 1 ? "Entities · 1" : `Entities · ${String(count)}`;

  return (
    <CollapsibleSection
      className="entities"
      headingId="entities-heading"
      id="entities"
      title={title}
    >
      {items.length === 0 ? (
        <p className="entities-empty">No entities in Product IR.</p>
      ) : (
        <ul className="entity-list">
          {items.map((entity, index) => {
            const validFields = validEntityFields(entity);
            const invalidFields = invalidEntityFields(entity);
            const fieldCount = validFields.length;

            return (
              <li className="entity" key={`entity-${String(index)}`}>
                <p className="entity-name">{entity.name}</p>
                <p className="entity-meta product-meta">
                  {fieldCount === 1
                    ? "1 field"
                    : `${String(fieldCount)} fields`}
                </p>
                <p className="file">{entity.sourceFile}</p>
                {validFields.length > 0 ? (
                  <ul className="field-chips">
                    {validFields.map((field, fieldIndex) => (
                      <li
                        className="field-chip"
                        key={`field-${String(index)}-${String(fieldIndex)}`}
                      >
                        <span className="field-chip-name">{field.name}</span>
                        {field.optional === true ? (
                          <span className="field-chip-optional">Optional</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {invalidFields.length > 0 ? (
                  <section
                    aria-labelledby={`entity-${String(index)}-invalid-fields`}
                    className="invalid-entity-fields"
                  >
                    <h4 id={`entity-${String(index)}-invalid-fields`}>
                      Fields (invalid)
                    </h4>
                    <ul className="invalid-entity-fields-list">
                      {invalidFields.map((field) =>
                        field.kind === "invalid" ? (
                          <li
                            className="invalid-entry"
                            key={`entity-field-invalid-${String(index)}-${String(field.index)}`}
                          >
                            <p>Field entry {field.index} is invalid.</p>
                            <JsonTree value={field.raw} />
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </section>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </CollapsibleSection>
  );
}
