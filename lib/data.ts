import { Product } from './types'

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Classic Sourdough',
    description: 'Our signature sourdough bread with a perfectly crispy crust and soft, tangy interior. Fermented for 24 hours.',
    price: 8.50,
    category: 'bread',
    image: '/images/sourdough.jpg',
    featured: true,
    stock: 25,
    ingredients: ['Organic flour', 'Water', 'Salt', 'Sourdough starter']
  },
  {
    id: '2',
    name: 'French Baguette',
    description: 'Traditional French baguette with a golden crust and light, airy crumb. Perfect for any meal.',
    price: 4.50,
    category: 'bread',
    image: '/images/baguette.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Water', 'Yeast', 'Salt']
  },
  {
    id: '3',
    name: 'Butter Croissant',
    description: 'Flaky, buttery layers of perfection. Made with premium French butter.',
    price: 4.00,
    category: 'pastry',
    image: '/images/croissant.jpg',
    featured: true,
    stock: 30,
    ingredients: ['Flour', 'French butter', 'Sugar', 'Yeast', 'Salt', 'Milk']
  },
  {
    id: '4',
    name: 'Cinnamon Roll',
    description: 'Soft, gooey cinnamon roll topped with cream cheese frosting.',
    price: 5.00,
    category: 'pastry',
    image: '/images/cinnamon-roll.jpg',
    featured: true,
    stock: 20,
    ingredients: ['Flour', 'Butter', 'Cinnamon', 'Brown sugar', 'Cream cheese']
  },
  {
    id: '5',
    name: 'Chocolate Cake Slice',
    description: 'Rich, moist chocolate cake with Belgian chocolate ganache.',
    price: 6.50,
    category: 'cake',
    image: '/images/chocolate-cake.jpg',
    featured: false,
    stock: 15,
    ingredients: ['Flour', 'Cocoa', 'Belgian chocolate', 'Eggs', 'Butter']
  },
  {
    id: '6',
    name: 'Rustic Whole Wheat',
    description: 'Hearty whole wheat bread packed with fiber and nutrients.',
    price: 7.00,
    category: 'bread',
    image: '/images/whole-wheat.jpg',
    featured: false,
    stock: 18,
    ingredients: ['Whole wheat flour', 'Water', 'Honey', 'Yeast', 'Salt']
  },
  {
    id: '7',
    name: 'Almond Croissant',
    description: 'Classic croissant filled with almond cream and topped with sliced almonds.',
    price: 5.50,
    category: 'pastry',
    image: '/images/almond-croissant.jpg',
    featured: false,
    stock: 22,
    ingredients: ['Flour', 'Butter', 'Almonds', 'Almond paste', 'Sugar']
  },
  {
    id: '8',
    name: 'Chocolate Chip Cookie',
    description: 'Chewy chocolate chip cookie with Belgian chocolate chunks.',
    price: 3.00,
    category: 'cookie',
    image: '/images/chocolate-chip-cookie.jpg',
    featured: false,
    stock: 50,
    ingredients: ['Flour', 'Butter', 'Belgian chocolate', 'Brown sugar', 'Eggs']
  },
  {
    id: '9',
    name: 'Olive Focaccia',
    description: 'Italian flatbread topped with rosemary, sea salt, and Mediterranean olives.',
    price: 9.00,
    category: 'bread',
    image: '/images/focaccia.jpg',
    featured: false,
    stock: 12,
    ingredients: ['Flour', 'Olive oil', 'Olives', 'Rosemary', 'Sea salt']
  },
  {
    id: '10',
    name: 'Apple Danish',
    description: 'Flaky pastry filled with cinnamon-spiced apples and drizzled with vanilla glaze.',
    price: 4.50,
    category: 'pastry',
    image: '/images/apple-danish.jpg',
    featured: false,
    stock: 18,
    ingredients: ['Flour', 'Butter', 'Apples', 'Cinnamon', 'Vanilla']
  },
  {
    id: '11',
    name: 'Carrot Cake Slice',
    description: 'Moist carrot cake with walnuts and cream cheese frosting.',
    price: 6.00,
    category: 'cake',
    image: '/images/carrot-cake.jpg',
    featured: false,
    stock: 14,
    ingredients: ['Carrots', 'Flour', 'Walnuts', 'Cream cheese', 'Cinnamon']
  },
  {
    id: '12',
    name: 'Oatmeal Raisin Cookie',
    description: 'Chewy oatmeal cookie packed with plump raisins and a hint of cinnamon.',
    price: 2.50,
    category: 'cookie',
    image: '/images/oatmeal-cookie.jpg',
    featured: false,
    stock: 45,
    ingredients: ['Oats', 'Flour', 'Raisins', 'Butter', 'Cinnamon']
  }
]
