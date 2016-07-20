/* global Text */

var xml = require('./xml');
var msg = require('@cdo/locale');
var _ = require('lodash');

/**
 * Create the textual XML for a math_number block.
 * @param {number|string} number The numeric amount, expressed as a
 *     number or string.  Non-numeric strings may also be specified,
 *     such as '???'.
 * @return {string} The textual representation of a math_number block.
 */
exports.makeMathNumber = function (number) {
  return '<block type="math_number"><title name="NUM">' +
    number + '</title></block>';
};

/**
 * Generate a required blocks dictionary for a simple block that does not
 * have any parameters or values.
 * @param {string} block_type The block type.
 * @return {Object} A required blocks dictionary able to check for and
 *     generate the specified block.
 */
exports.simpleBlock = function (block_type) {
  return {test: function (block) {return block.type === block_type; },
    type: block_type};
};

/**
 * Generate a required blocks dictionary for a repeat loop.  This does not
 * test for the specified repeat count but includes it in the suggested block.
 * @param {number|string} count The suggested repeat count.
 * @return {Object} A required blocks dictionary able to check for and
 *     generate the specified block.
 */
exports.repeat = function (count) {
  // This checks for a controls_repeat block rather than looking for 'for',
  // since the latter may be generated by Turtle 2's draw_a_square.
  return {test: function (block) {return block.type === 'controls_repeat';},
    type: 'controls_repeat', titles: {'TIMES': count}};
};

/**
 * Generate a required blocks dictionary for a simple repeat loop.  This does not
 * test for the specified repeat count but includes it in the suggested block.
 * @param {number|string} count The suggested repeat count.
 * @return {Object} A required blocks dictionary able to check for and
 *     generate the specified block.
 */
exports.repeatSimpleBlock = function (count) {
  return {test: function (block) {return block.type === 'controls_repeat_simplified';},
    type: 'controls_repeat_simplified', titles: {'TIMES': count}};
};

/**
 * Returns an array of required blocks by comparing a list of blocks with
 * a list of app specific block tests (defined in <app>/requiredBlocks.js)
 */
exports.makeTestsFromBuilderRequiredBlocks = function (customRequiredBlocks) {
  var blocksXml = xml.parseElement(customRequiredBlocks);

  var requiredBlocksTests = [];
  Array.prototype.forEach.call(blocksXml.childNodes, function (childNode) {
    // Only look at element nodes
    if (childNode.nodeType !== 1) {
      return;
    }
    switch (childNode.getAttribute('type')) {
      case 'pick_one':
        requiredBlocksTests.push(testsFromPickOne(childNode));
        break;
      case 'procedures_defnoreturn':
      case 'procedures_defreturn':
        requiredBlocksTests.push(testsFromProcedure(childNode));
        break;
      case 'functional_definition':
        break;
      case 'functional_call':
        requiredBlocksTests.push(testsFromFunctionalCall(childNode, blocksXml));
        break;
      default:
        requiredBlocksTests.push([testFromBlock(childNode)]);
    }
  });

  return requiredBlocksTests;
};

/**
 * Given xml for a single block generates a block test
 */
function testFromBlock(node) {
  return {
    test: function (userBlock) {
      // Encode userBlock while ignoring child statements
      var userElement = Blockly.Xml.blockToDom(userBlock, true);
      return elementsEquivalent(node, userElement);
    },
    blockDisplayXML: xml.serialize(node)
  };
}

/**
 * Given xml for a pick_one block, generates a test that checks that at least
 * one of the child blocks is used.  If none are used, the first option will be
 * displayed as feedback
 */
function testsFromPickOne(node) {
  var tests = [];
  // child of pick_one is a statement block.  we want first child of that
  var statement = node.getElementsByTagName('statement')[0];
  var block = statement.getElementsByTagName('block')[0];
  var next;
  do {
    // if we have a next block, we want to generate our test without that
    next = block.getElementsByTagName('next')[0];
    if (next) {
      block.removeChild(next);
    }
    tests.push(testFromBlock(block));
    if (next) {
      block = next.getElementsByTagName('block')[0];
    }
  } while (next);
  return tests;
}

/**
 * Given xml for a procedure block, generates tests that check for required
 * number of params not declared
 */
function testsFromProcedure(node) {
  var paramCount = node.querySelectorAll('mutation > arg').length;
  var emptyBlock = node.cloneNode(true);
  emptyBlock.removeChild(emptyBlock.lastChild);
  return [{
    // Ensure that all required blocks match a block with the same number of
    // params. There's no guarantee users will name their function the same as
    // the required block, so only match on number of params.
    test: function (userBlock) {
      if (userBlock.type === node.getAttribute('type')) {
        return paramCount === userBlock.parameterNames_.length;
      }
      // Block isn't the same type, return false to keep searching.
      return false;
    },
    message: msg.errorRequiredParamsMissing(),
    blockDisplayXML: '<xml></xml>'
  }];
}

function testsFromFunctionalCall(node, blocksXml) {
  var name = node.querySelector('mutation').getAttribute('name');
  var argElements = node.querySelectorAll('arg');
  var types = [];
  for (var i = 0; i < argElements.length; i++) {
    types.push(argElements[i].getAttribute('type'));
  }

  var definition = _.find(blocksXml.childNodes, function (sibling) {
    if (sibling.getAttribute('type') !== 'functional_definition') {
      return false;
    }
    var nameElement = sibling.querySelector('title[name="NAME"]');
    if (!nameElement) {
      return false;
    }
    return nameElement.textContent === name;
  });

  if (!definition) {
    throw new Error('No matching definition for functional_call');
  }

  return [{
    test: function (userBlock) {
      if (userBlock.type !== 'functional_call' ||
          userBlock.getCallName() !== name) {
        return false;
      }
      var userTypes = userBlock.getParamTypes();
      return _.isEqual(userTypes, types);
    },
    blockDisplayXML: xml.serialize(definition) + xml.serialize(node)
  }];

}

/**
 * Checks two DOM elements to see whether or not they are equivalent
 * We consider them equivalent if they have the same tagName, attributes,
 * and children
 */
function elementsEquivalent(expected, given) {
  if (!(expected instanceof Element && given instanceof Element)) {
    // if we expect ???, allow match with anything
    if (expected instanceof Text && expected.textContent === '???') {
      return true;
    }
    return expected.isEqualNode(given);
  }
  // Not fully clear to me why, but blockToDom seems to return us an element
  // with a tagName in all caps
  if (expected.tagName.toLowerCase() !== given.tagName.toLowerCase()) {
    return false;
  }

  if (!attributesEquivalent(expected, given)) {
    return false;
  }

  if (!childrenEquivalent(expected, given)) {
    return false;
  }

  return true;
}

/**
 * A list of attributes we want to ignore when comparing attributes, and a
 * function for easily determining whether an attribute is in the list.
 */
var ignorableAttributes = [
  'deletable',
  'movable',
  'editable',
  'inline',
  'uservisible',
  'usercreated',
  'id'
];

ignorableAttributes.contains = function (attr) {
  return ignorableAttributes.indexOf(attr.name) !== -1;
};

/**
 * Checks whether the attributes for two different elements are equivalent
 */
function attributesEquivalent(expected, given) {
  var attributes1 = _.reject(expected.attributes, ignorableAttributes.contains);
  var attributes2 = _.reject(given.attributes, ignorableAttributes.contains);
  if (attributes1.length !== attributes2.length) {
    return false;
  }
  for (var i = 0; i < attributes1.length; i++) {
    var attr1 = attributes1[i];
    var attr2 = attributes2[i];
    if (attr1.name !== attr2.name) {
      return false;
    }
    if (attr1.value !== attr2.value) {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether the children of two different elements are equivalent
 */
function childrenEquivalent(expected, given) {
  var children1 = expected.childNodes;
  var children2 = given.childNodes;
  if (children1.length !== children2.length) {
    return false;
  }
  for (var i = 0; i < children1.length; i++) {
    if (!elementsEquivalent(children1[i], children2[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if two blocks are "equivalent"
 * Currently means their type and all of their titles match exactly
 * @param blockA
 * @param blockB
 */
exports.blocksMatch = function (blockA, blockB) {
  var typesMatch = blockA.type === blockB.type;
  var titlesMatch = exports.blockTitlesMatch(blockA, blockB);
  return typesMatch && titlesMatch;
};

/**
 * Compares two blocks' titles, returns true if they all match
 * @returns {boolean}
 * @param blockA
 * @param blockB
 */
exports.blockTitlesMatch = function (blockA, blockB) {
  var blockATitles = blockA.getTitles();
  var blockBTitles = blockB.getTitles();

  var nameCompare = function (a,b) { return a.name < b.name; };
  blockATitles.sort(nameCompare);
  blockBTitles.sort(nameCompare);

  for (var i = 0; i < blockATitles.length || i < blockBTitles.length; i++) {
    var blockATitle = blockATitles[i];
    var blockBTitle = blockBTitles[i];
    if (!blockATitle || !blockBTitle ||
      !titlesMatch(blockATitle, blockBTitle)) {
      return false;
    }
  }
  return true;
};

var titlesMatch = function (titleA, titleB) {
  return titleB.name === titleA.name &&
    titleB.getValue() === titleA.getValue();
};
