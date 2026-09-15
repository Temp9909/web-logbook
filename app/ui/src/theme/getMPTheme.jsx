import { getDesignTokens } from './themePrimitives';
import {
  dataDisplayCustomizations,
  feedbackCustomizations,
  inputsCustomizations,
  surfacesCustomizations,
  navigationCustomizations,
  dataGridCustomizations,
} from './customizations';

export default function getMPTheme(mode) {
  return {
    ...getDesignTokens(mode),
    components: {
      ...surfacesCustomizations,
      ...inputsCustomizations,
      ...navigationCustomizations,
      ...dataDisplayCustomizations,
      ...feedbackCustomizations,
      ...dataGridCustomizations,
    },
  };
}
