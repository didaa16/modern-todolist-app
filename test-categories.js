// Simple test script to verify category functionality
const { categoryService, taskService } = require('./client/src/services/localStorage.js');

console.log('Testing Category Management Features...\n');

// Test 1: Create a new category
console.log('1. Testing category creation...');
try {
  const newCategory = categoryService.create({
    name: 'Test Category',
    color: '#FF5733'
  });
  console.log('✓ Category created:', newCategory);
} catch (error) {
  console.log('✗ Error creating category:', error.message);
}

// Test 2: Get all categories
console.log('\n2. Testing get all categories...');
try {
  const categories = categoryService.getAll();
  console.log('✓ Categories retrieved:', categories.length, 'categories found');
  categories.forEach(cat => console.log(`  - ${cat.name} (${cat.color})`));
} catch (error) {
  console.log('✗ Error getting categories:', error.message);
}

// Test 3: Update a category
console.log('\n3. Testing category update...');
try {
  const categories = categoryService.getAll();
  if (categories.length > 0) {
    const updatedCategory = categoryService.update(categories[0].id, {
      name: 'Updated Category Name',
      color: '#00FF00'
    });
    console.log('✓ Category updated:', updatedCategory);
  } else {
    console.log('⚠ No categories to update');
  }
} catch (error) {
  console.log('✗ Error updating category:', error.message);
}

// Test 4: Create a task with a category
console.log('\n4. Testing task creation with category...');
try {
  const categories = categoryService.getAll();
  if (categories.length > 0) {
    const newTask = taskService.create({
      title: 'Test Task',
      description: 'A test task for category testing',
      category: categories[0].name,
      priority: 'high',
      dueDate: '2024-01-15'
    });
    console.log('✓ Task created with category:', newTask);
  } else {
    console.log('⚠ No categories available to create task');
  }
} catch (error) {
  console.log('✗ Error creating task:', error.message);
}

// Test 5: Try to delete a category with tasks
console.log('\n5. Testing category deletion with tasks...');
try {
  const categories = categoryService.getAll();
  const tasks = taskService.getAll();
  
  if (categories.length > 0) {
    const categoryWithTasks = categories.find(cat => 
      tasks.some(task => task.category === cat.name)
    );
    
    if (categoryWithTasks) {
      try {
        categoryService.delete(categoryWithTasks.id);
        console.log('✗ Category deleted unexpectedly (should have failed)');
      } catch (error) {
        console.log('✓ Category deletion properly blocked:', error.message);
      }
    } else {
      console.log('⚠ No categories with tasks found to test deletion');
    }
  } else {
    console.log('⚠ No categories available to test deletion');
  }
} catch (error) {
  console.log('✗ Error testing category deletion:', error.message);
}

// Test 6: Delete a category without tasks
console.log('\n6. Testing category deletion without tasks...');
try {
  const categories = categoryService.getAll();
  const tasks = taskService.getAll();
  
  const categoryWithoutTasks = categories.find(cat => 
    !tasks.some(task => task.category === cat.name)
  );
  
  if (categoryWithoutTasks) {
    const result = categoryService.delete(categoryWithoutTasks.id);
    console.log('✓ Category deleted successfully:', result);
  } else {
    console.log('⚠ No categories without tasks found to test deletion');
  }
} catch (error) {
  console.log('✗ Error deleting category:', error.message);
}

console.log('\nCategory management test completed!');
