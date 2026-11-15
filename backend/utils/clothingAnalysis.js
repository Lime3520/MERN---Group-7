const CATEGORIES = [
  'top', 'bottom', 'dress', 'outerwear', 'footwear', 'accessory',
  'activewear', 'swimwear', 'underwear', 'other'
];

const PATTERNS = [
  'solid', 'striped', 'plaid', 'checked', 'floral', 'graphic',
  'polka-dot', 'animal-print', 'camouflage', 'abstract', 'other', 'unknown'
];

const FITS = ['slim', 'regular', 'relaxed', 'oversized', 'fitted', 'other', 'unknown'];
const AUDIENCES = ['mens', 'womens', 'unisex', 'kids', 'unknown'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const OCCASIONS = [
  'casual', 'work', 'formal', 'party', 'date', 'athletic',
  'outdoor', 'travel', 'loungewear'
];
const FORMALITY_LEVELS = ['casual', 'smart-casual', 'business', 'formal'];
const WARMTH_LEVELS = ['light', 'medium', 'warm'];

const stringEnum = (values, description) => ({
  type: 'string',
  enum: values,
  description
});

const stringArray = (description, enumValues) => ({
  type: 'array',
  description,
  items: enumValues ? { type: 'string', enum: enumValues } : { type: 'string' }
});

const clothingAnalysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description: 'Short generic display name, such as Navy crew-neck T-shirt. Do not guess a brand.'
    },
    category: stringEnum(CATEGORIES, 'Broad garment category.'),
    subcategory: {
      type: 'string',
      description: 'Specific garment type, such as t-shirt, jeans, sneakers, or blazer.'
    },
    intendedAudience: stringEnum(AUDIENCES, 'Likely merchandising audience; use unknown when unclear.'),
    primaryColor: {
      type: 'string',
      description: 'Most prominent common color name.'
    },
    secondaryColors: stringArray('Other clearly visible colors. Return an empty array when there are none.'),
    pattern: stringEnum(PATTERNS, 'The visible surface pattern.'),
    materials: stringArray('Likely materials visible or strongly implied by the garment. Use unknown when uncertain.'),
    fit: stringEnum(FITS, 'Apparent garment fit; use unknown when it cannot be judged from the image.'),
    styleTags: stringArray('Two to five concise style descriptors, such as minimalist, streetwear, or preppy.'),
    seasons: stringArray('Seasons in which this item is practical.', SEASONS),
    occasions: stringArray('Appropriate use cases for this item.', OCCASIONS),
    formality: stringEnum(FORMALITY_LEVELS, 'Overall formality level.'),
    warmth: stringEnum(WARMTH_LEVELS, 'Approximate warmth provided by the item.'),
    description: {
      type: 'string',
      description: 'One factual sentence describing visible features. Do not invent unseen details.'
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Overall confidence in the visual classification from 0 to 1.'
    }
  },
  required: [
    'name', 'category', 'subcategory', 'intendedAudience', 'primaryColor',
    'secondaryColors', 'pattern', 'materials', 'fit', 'styleTags', 'seasons',
    'occasions', 'formality', 'warmth', 'description', 'confidence'
  ]
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isStringArray = (value) => Array.isArray(value) && value.every(isNonEmptyString);
const isEnumArray = (value, allowed) => isStringArray(value) && value.every((item) => allowed.includes(item));

const validateClothingAnalysis = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return (
    isNonEmptyString(value.name) &&
    CATEGORIES.includes(value.category) &&
    isNonEmptyString(value.subcategory) &&
    AUDIENCES.includes(value.intendedAudience) &&
    isNonEmptyString(value.primaryColor) &&
    isStringArray(value.secondaryColors) &&
    PATTERNS.includes(value.pattern) &&
    isStringArray(value.materials) &&
    FITS.includes(value.fit) &&
    isStringArray(value.styleTags) &&
    isEnumArray(value.seasons, SEASONS) &&
    isEnumArray(value.occasions, OCCASIONS) &&
    FORMALITY_LEVELS.includes(value.formality) &&
    WARMTH_LEVELS.includes(value.warmth) &&
    isNonEmptyString(value.description) &&
    typeof value.confidence === 'number' &&
    value.confidence >= 0 && value.confidence <= 1
  );
};

module.exports = { clothingAnalysisSchema, validateClothingAnalysis };

