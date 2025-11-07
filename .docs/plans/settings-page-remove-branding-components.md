## Summary
- The `app/(pages)/settings/page.tsx` module renders branding upload inputs (logo, favicon, slogan, description, colors) and a branding preview card that the user wants removed.
- The extra helpers `renderImageField`, `renderColorField`, and `renderTextareaField` exist solely to support those branding controls, so they should be deleted once the fields are gone.

## Plan
1. Update `GENERAL_FIELDS` to drop the branding-related entries so the dynamic form no longer renders them.
2. Remove the now-unused helper renderers and the branding preview card, along with related state/utilities (uploading state, file refs, handlers) that become dead code after dropping the fields.
3. Verify the page compiles by ensuring only the remaining general/account/database sections render correctly without references to deleted code.

