const keywords = ['TODO', 'FIXME', 'IN PROGRESS', 'DONE'];
const keywordGroup = keywords.join('|');

const regex = new RegExp(
    `(?<prefix>//|#|<!--|/\\*|^\\s*-?\\s*|^\\s*)\\s*` + 
    `(?<keyword>${keywordGroup})` +
    `(?:\\s*\\{(?<moscow>[a-zA-Z])\\})?` +
    `(?:\\s*\\[(?<labels>[^\\]]+)\\])?` +
    `(?:\\s*\\((?<priority>[a-zA-Z])\\))?` +
    `(?:\\s*:)?\\s*` +
    `(?<message>.*)`,
    'ig'
);

const testCases = [
    "// TODO: task 1",
    "# FIXME {M} [backend] (H): task 2",
    "<!-- IN PROGRESS [ui] (L): task 3 -->",
    "- TODO {S}: task 4",
    "  TODO: task 5",
    "/* DONE (M): task 6 */",
    "Just some text with TODO: task 7",
    "TODO: task 8", // No prefix test
];

testCases.forEach(line => {
    regex.lastIndex = 0;
    const match = regex.exec(line);
    if (match) {
        console.log(`MATCH: "${line}"`);
        console.log(`  Prefix: "${match.groups.prefix}"`);
        console.log(`  Keyword: "${match.groups.keyword}"`);
        console.log(`  Message: "${match.groups.message}"`);
    } else {
        console.log(`NO MATCH: "${line}"`);
    }
});
