const faker = require('@faker-js/faker').faker;

class FactoryTypes {
    /**
     * Generate a random name
     */
    static name() {
        return () => faker.person.fullName();
    }

    /**
     * Generate a first name
     */
    static firstName() {
        return () => faker.person.firstName();
    }

    /**
     * Generate a last name
     */
    static lastName() {
        return () => faker.person.lastName();
    }

    /**
     * Generate an email address
     */
    static email() {
        return () => faker.internet.email();
    }

    /**
     * Generate a unique email
     */
    static uniqueEmail() {
        const used = new Set();
        return () => {
            let email;
            do {
                email = faker.internet.email();
            } while (used.has(email));
            used.add(email);
            return email;
        };
    }

    /**
     * Generate a password
     */
    static password(length = 12) {
        return () => faker.internet.password({ length });
    }

    /**
     * Generate a phone number
     */
    static phoneNumber() {
        return () => faker.phone.number();
    }

    /**
     * Generate an address
     */
    static address() {
        return () => faker.location.streetAddress();
    }

    /**
     * Generate a city
     */
    static city() {
        return () => faker.location.city();
    }

    /**
     * Generate a country
     */
    static country() {
        return () => faker.location.country();
    }

    /**
     * Generate a company name
     */
    static company() {
        return () => faker.company.name();
    }

    /**
     * Generate lorem ipsum text
     */
    static text(sentences = 3) {
        return () => faker.lorem.sentences(sentences);
    }

    /**
     * Generate a paragraph
     */
    static paragraph(sentences = 5) {
        return () => faker.lorem.paragraph(sentences);
    }

    /**
     * Generate a sentence
     */
    static sentence(words = 10) {
        return () => faker.lorem.sentence(words);
    }

    /**
     * Generate words
     */
    static words(count = 5) {
        return () => faker.lorem.words(count);
    }

    /**
     * Generate a random integer
     */
    static integer(min = 1, max = 1000) {
        return () => faker.number.int({ min, max });
    }

    /**
     * Generate a random float
     */
    static float(min = 0, max = 100, precision = 2) {
        return () => parseFloat(faker.number.float({ min, max, precision }).toFixed(precision));
    }

    /**
     * Generate a random boolean
     */
    static boolean() {
        return () => faker.datatype.boolean();
    }

    /**
     * Generate a random date
     */
    static date(from = '2020-01-01', to = '2024-12-31') {
        return () => faker.date.between({ from, to });
    }

    /**
     * Generate a future date
     */
    static futureDate(years = 1) {
        return () => faker.date.future({ years });
    }

    /**
     * Generate a past date
     */
    static pastDate(years = 1) {
        return () => faker.date.past({ years });
    }

    /**
     * Generate a recent date
     */
    static recentDate(days = 10) {
        return () => faker.date.recent({ days });
    }

    /**
     * Generate a URL
     */
    static url() {
        return () => faker.internet.url();
    }

    /**
     * Generate an image URL
     */
    static imageUrl(width = 640, height = 480) {
        return () => faker.image.url({ width, height });
    }

    /**
     * Generate a UUID
     */
    static uuid() {
        return () => faker.string.uuid();
    }

    /**
     * Generate a ULID
     */
    static ulid() {
        return () => {
            const { ulid } = require('ulid');
            return ulid();
        };
    }

    /**
     * Generate a color
     */
    static color() {
        return () => faker.color.rgb();
    }

    /**
     * Generate a hex color
     */
    static hexColor() {
        return () => faker.color.rgb({ format: 'hex' });
    }

    /**
     * Pick random element from array
     */
    static randomElement(array) {
        return () => faker.helpers.arrayElement(array);
    }

    /**
     * Pick multiple random elements from array
     */
    static randomElements(array, count = 1) {
        return () => faker.helpers.arrayElements(array, count);
    }

    /**
     * Generate random enum value
     */
    static enum(values) {
        return () => faker.helpers.arrayElement(values);
    }

    /**
     * Generate a sequence of values
     */
    static sequence(callback) {
        let index = 0;
        return () => callback(++index);
    }

    /**
     * Generate conditional value
     */
    static conditional(condition, trueValue, falseValue) {
        return () => condition() ? trueValue() : falseValue();
    }

    /**
     * Generate value based on other attributes
     */
    static computed(callback) {
        return callback;
    }

    /**
     * Generate a price (decimal with 2 decimal places)
     */
    static price(min = 10, max = 1000) {
        return () => parseFloat(faker.number.float({ min, max, precision: 0.01 }).toFixed(2));
    }

    /**
     * Generate a username
     */
    static username() {
        return () => faker.internet.userName();
    }

    /**
     * Generate a slug
     */
    static slug(words = 3) {
        return () => faker.lorem.slug(words);
    }

    /**
     * Generate a file name
     */
    static fileName(extension = 'txt') {
        return () => `${faker.lorem.slug()}.${extension}`;
    }

    /**
     * Generate JSON data
     */
    static json(structure) {
        return () => {
            if (typeof structure === 'function') {
                return structure();
            }
            
            const result = {};
            for (const [key, value] of Object.entries(structure)) {
                if (typeof value === 'function') {
                    result[key] = value();
                } else {
                    result[key] = value;
                }
            }
            return result;
        };
    }

    /**
     * Generate null value (for nullable fields)
     */
    static nullable(generator, probability = 0.1) {
        return () => {
            return Math.random() < probability ? null : generator();
        };
    }

    /**
     * Generate optional value (sometimes null)
     */
    static optional(generator, probability = 0.8) {
        return () => {
            return Math.random() < probability ? generator() : null;
        };
    }
}

module.exports = FactoryTypes;