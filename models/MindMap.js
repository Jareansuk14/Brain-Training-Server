const mongoose = require('mongoose');

// Schema สำหรับ Node 
const nodeSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  isExpanded: {
    type: Boolean,
    default: true
  },
  children: [{
    type: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Schema หลักสำหรับ MindMap
const mindMapSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  root: {
    type: nodeSchema,
    required: true,
    default: {
      content: 'หัวข้อหลัก',
      children: [],
      isExpanded: true
    }
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true 
});

// Helper method to find node by ID recursively
mindMapSchema.methods.findNodeById = function(nodeId, currentNode = this.root) {
  if (currentNode._id.toString() === nodeId.toString()) {
    return { node: currentNode, parent: null };
  }

  if (currentNode.children && currentNode.children.length > 0) {
    for (let i = 0; i < currentNode.children.length; i++) {
      const result = this.findNodeById(nodeId, currentNode.children[i]);
      if (result.node) {
        return result.parent ? result : { node: result.node, parent: currentNode };
      }
    }
  }

  return { node: null, parent: null };
};

// Helper method to update node by ID
mindMapSchema.methods.updateNode = function(nodeId, updates) {
  const updateNodeInTree = (node) => {
    if (!node) return false;
    
    if (node._id.toString() === nodeId.toString()) {
      Object.assign(node, updates, {
        updatedAt: new Date()
      });
      return true;
    }
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (updateNodeInTree(child)) return true;
      }
    }
    
    return false;
  };

  const updated = updateNodeInTree(this.root);
  if (updated) {
    this.lastModified = new Date();
  }
  return updated;
};

// Helper method to delete node by ID
mindMapSchema.methods.deleteNode = function(nodeId) {
  const { node, parent } = this.findNodeById(nodeId);
  
  if (!node) return false;
  if (!parent) return false; // ป้องกันการลบ root node
  
  const index = parent.children.findIndex(
    child => child._id.toString() === nodeId.toString()
  );
  
  if (index > -1) {
    parent.children.splice(index, 1);
    this.lastModified = new Date();
    return true;
  }
  
  return false;
};

// Helper method to add new node
mindMapSchema.methods.addNode = function(parentId, content) {
  const { node: parentNode } = this.findNodeById(parentId);
  
  if (!parentNode) return null;

  const newNode = {
    _id: new mongoose.Types.ObjectId(),
    content: content || 'หัวข้อใหม่',
    children: [],
    isExpanded: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  if (!parentNode.children) {
    parentNode.children = [];
  }
  
  parentNode.children.push(newNode);
  this.lastModified = new Date();
  
  return newNode;
};

// Add middleware to update lastModified before save
mindMapSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('MindMap', mindMapSchema);