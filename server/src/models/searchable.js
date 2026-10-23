/**
 * Adds index-friendly search fields to a schema.
 *  - nameLower:  lowercase full name         -> prefix search on "sarah kh"
 *  - nameTokens: lowercase words (multikey)  -> prefix search on any word, e.g. "khan"
 * Both are queried with anchored regexes, which MongoDB can answer from the index.
 */
module.exports = function searchable(schema) {
  schema.add({
    nameLower: { type: String, select: false },
    nameTokens: { type: [String], select: false },
  });
  schema.pre('save', function () {
    if (this.isNew || this.isModified('name')) {
      this.nameLower = this.name.toLowerCase().trim();
      this.nameTokens = this.nameLower.split(/\s+/);
    }
  });
  schema.index({ nameLower: 1 });
  schema.index({ nameTokens: 1 });
  schema.set('toJSON', {
    transform: (_doc, ret) => {
      delete ret.nameLower;
      delete ret.nameTokens;
      delete ret.__v;
      return ret;
    },
  });
};
