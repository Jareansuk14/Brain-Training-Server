const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  children: [{
    type: mongoose.Schema.Types.Mixed
  }],
  isExpanded: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const mindMapSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  root: nodeSchema,
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified before save
mindMapSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Helper method to find a node by ID recursively
mindMapSchema.methods.findNodeById = function(nodeId, currentNode = this.root) {
  if (currentNode._id.toString() === nodeId) {
    return currentNode;
  }
  
  if (currentNode.children) {
    for (const child of currentNode.children) {
      const found = this.findNodeById(nodeId, child);
      if (found) return found;
    }
  }
  
  return null;
};

// Helper method to update a node by ID
mindMapSchema.methods.updateNode = function(nodeId, updates) {
  const updateNodeInTree = (node) => {
    if (node._id.toString() === nodeId) {
      Object.assign(node, updates);
      return true;
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (updateNodeInTree(child)) return true;
      }
    }
    
    return false;
  };
  
  updateNodeInTree(this.root);
};

// Helper method to delete a node by ID
mindMapSchema.methods.deleteNode = function(nodeId) {
  const deleteNodeFromTree = (node) => {
    if (node.children) {
      const initialLength = node.children.length;
      node.children = node.children.filter(child => child._id.toString() !== nodeId);
      
      if (node.children.length === initialLength) {
        for (const child of node.children) {
          deleteNodeFromTree(child);
        }
      }
    }
  };
  
  deleteNodeFromTree(this.root);
};

module.exports = mongoose.model('MindMap', mindMapSchema);