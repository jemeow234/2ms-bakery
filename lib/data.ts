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
  },
  {
    id: '13',
    name: 'Pandesal (6 pcs)',
    description: 'The Filipino breakfast staple. Soft, slightly sweet rolls rolled in breadcrumbs and baked fresh every morning.',
    price: 40.00,
    category: 'bread',
    image: '/images/whole-wheat.jpg',
    featured: true,
    stock: 60,
    ingredients: ['Flour', 'Water', 'Yeast', 'Sugar', 'Salt', 'Breadcrumbs']
  },
  {
    id: '14',
    name: 'Ube Cheese Pandesal (4 pcs)',
    description: 'Purple yam pandesal with a molten cheese center that stretches with every bite.',
    price: 75.00,
    category: 'bread',
    image: '/images/sourdough.jpg',
    featured: true,
    stock: 35,
    ingredients: ['Flour', 'Ube halaya', 'Quick melt cheese', 'Butter', 'Milk', 'Yeast']
  },
  {
    id: '15',
    name: 'Spanish Bread (6 pcs)',
    description: 'Rolled soft bread with a buttery sugar filling, baked until golden and lightly crisp at the edges.',
    price: 60.00,
    category: 'pastry',
    image: '/images/cinnamon-roll.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Milk', 'Breadcrumbs', 'Eggs']
  },
  {
    id: '16',
    name: 'Ensaymada',
    description: 'Brioche-soft coil brushed with butter, topped with sugar and a generous blanket of grated cheese.',
    price: 55.00,
    category: 'pastry',
    image: '/images/almond-croissant.jpg',
    featured: true,
    stock: 30,
    ingredients: ['Flour', 'Butter', 'Egg yolks', 'Sugar', 'Edam cheese', 'Milk']
  },
  {
    id: '17',
    name: 'Pan de Coco (4 pcs)',
    description: 'Pillowy buns stuffed with sweet shredded coconut simmered in muscovado.',
    price: 50.00,
    category: 'pastry',
    image: '/images/apple-danish.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Coconut', 'Muscovado sugar', 'Butter', 'Milk', 'Yeast']
  },
  {
    id: '18',
    name: 'Ube Cake Slice',
    description: 'Moist purple yam chiffon layered with ube buttercream and a dusting of toasted coconut.',
    price: 120.00,
    category: 'cake',
    image: '/images/carrot-cake.jpg',
    featured: false,
    stock: 15,
    ingredients: ['Ube halaya', 'Flour', 'Eggs', 'Coconut milk', 'Butter', 'Sugar']
  },
  {
    id: '19',
    name: 'Mamon (6 pcs)',
    description: 'Cloud-light sponge cakes baked in fluted cups and brushed with butter and sugar.',
    price: 90.00,
    category: 'cake',
    image: '/images/chocolate-cake.jpg',
    featured: false,
    stock: 20,
    ingredients: ['Flour', 'Eggs', 'Sugar', 'Butter', 'Milk', 'Cream of tartar']
  },
  {
    id: '20',
    name: 'Polvoron (10 pcs)',
    description: 'Toasted milk shortbread that melts on the tongue, hand-pressed and wrapped in cellophane.',
    price: 85.00,
    category: 'cookie',
    image: '/images/oatmeal-cookie.jpg',
    featured: false,
    stock: 45,
    ingredients: ['Toasted flour', 'Powdered milk', 'Butter', 'Sugar']
  },
  {
    id: '21',
    name: 'Otap (8 pcs)',
    description: 'Crisp oval puff pastry from Cebu, sugar-dusted and shatteringly flaky.',
    price: 70.00,
    category: 'cookie',
    image: '/images/chocolate-chip-cookie.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Coconut', 'Shortening', 'Sugar', 'Eggs']
  }
]
