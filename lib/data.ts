import { Product } from './types'

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Butterfly',
    description: 'Sugar-glazed bread folded into wings, soft in the middle with lightly crisp edges.',
    price: 5.00,
    category: 'pastry',
    image: '/images/butterfly.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Yeast', 'Milk', 'Eggs']
  },
  {
    id: '2',
    name: 'Coco German',
    description: 'Crisp German-style roll with a sweet toasted coconut filling.',
    price: 5.00,
    category: 'pastry',
    image: '/images/coco_german.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Coconut', 'Sugar', 'Butter', 'Yeast']
  },
  {
    id: '3',
    name: 'Coco Roll',
    description: 'Soft bread rolled around sweetened shredded coconut and baked golden.',
    price: 5.00,
    category: 'pastry',
    image: '/images/coco_roll.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Coconut', 'Sugar', 'Butter', 'Milk', 'Yeast']
  },
  {
    id: '4',
    name: 'Star Bread (Putok)',
    description: 'The classic putok — dense, faintly salty bread that cracks open into a star as it bakes.',
    price: 5.00,
    category: 'bread',
    image: '/images/star_bread__putok.jpg',
    featured: true,
    stock: 50,
    ingredients: ['Flour', 'Water', 'Sugar', 'Salt', 'Yeast']
  },
  {
    id: '5',
    name: 'Ube Pandesal',
    description: 'Purple yam pandesal rolled in breadcrumbs, soft and lightly sweet straight from the oven.',
    price: 5.00,
    category: 'bread',
    image: '/images/ube_pandesal.jpg',
    featured: true,
    stock: 60,
    ingredients: ['Flour', 'Ube halaya', 'Sugar', 'Milk', 'Butter', 'Yeast', 'Breadcrumbs']
  },
  {
    id: '6',
    name: 'Bicho',
    description: 'Twisted fried dough rolled in sugar, crisp outside and chewy within.',
    price: 6.00,
    category: 'pastry',
    image: '/images/bicho.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Sugar', 'Yeast', 'Eggs', 'Cooking oil']
  },
  {
    id: '7',
    name: 'Bicho (2)',
    description: 'Ring-cut bicho with a generous sugar coating on every side.',
    price: 6.00,
    category: 'pastry',
    image: '/images/bicho_2.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Sugar', 'Yeast', 'Eggs', 'Cooking oil']
  },
  {
    id: '8',
    name: 'Bicho (3)',
    description: 'Braided bicho fried to a deep gold and finished with fine sugar.',
    price: 6.00,
    category: 'pastry',
    image: '/images/bicho_3.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Sugar', 'Yeast', 'Eggs', 'Cooking oil']
  },
  {
    id: '9',
    name: 'Custard Bread',
    description: 'Pillowy bun filled with smooth vanilla custard.',
    price: 5.00,
    category: 'bread',
    image: '/images/custard_bread.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Eggs', 'Milk', 'Sugar', 'Butter', 'Vanilla']
  },
  {
    id: '10',
    name: 'Ensaymada',
    description: 'Brioche-soft coil brushed with butter, topped with sugar and grated cheese.',
    price: 5.00,
    category: 'pastry',
    image: '/images/ensaymada.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Egg yolks', 'Sugar', 'Cheese', 'Milk']
  },
  {
    id: '11',
    name: 'Kababayan',
    description: 'Little gold muffin-shaped sponge with a chewy crust. 2 pieces for 5 pesos.',
    price: 2.50,
    category: 'cake',
    image: '/images/kababayan.jpg',
    featured: false,
    stock: 80,
    ingredients: ['Flour', 'Eggs', 'Sugar', 'Milk', 'Baking powder']
  },
  {
    id: '12',
    name: 'Lambingan',
    description: 'Soft twin rolls baked side by side, buttery and lightly sweet.',
    price: 5.00,
    category: 'pastry',
    image: '/images/lambingan.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Milk', 'Yeast']
  },
  {
    id: '13',
    name: 'Pan de Coco',
    description: 'Pillowy bun stuffed with sweet shredded coconut simmered in muscovado.',
    price: 5.00,
    category: 'bread',
    image: '/images/pan_de_coco.jpg',
    featured: true,
    stock: 45,
    ingredients: ['Flour', 'Coconut', 'Muscovado sugar', 'Butter', 'Milk', 'Yeast']
  },
  {
    id: '14',
    name: 'Pinagong',
    description: 'Marinduque-style turtle-shaped bread, firm crust with a soft, faintly sweet crumb.',
    price: 5.00,
    category: 'bread',
    image: '/images/pinagong.jpg',
    featured: false,
    stock: 45,
    ingredients: ['Flour', 'Water', 'Sugar', 'Salt', 'Yeast', 'Breadcrumbs']
  },
  {
    id: '15',
    name: 'Pineapple Pie',
    description: 'Flaky hand pie packed with sweet-tart pineapple filling.',
    price: 5.00,
    category: 'pastry',
    image: '/images/pineapple_pie.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Butter', 'Pineapple', 'Sugar', 'Eggs']
  },
  {
    id: '16',
    name: 'Spanish Bread',
    description: 'Rolled soft bread with a buttery sugar filling, baked golden and lightly crisp at the edges.',
    price: 5.00,
    category: 'bread',
    image: '/images/spanish_bread.jpg',
    featured: true,
    stock: 50,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Milk', 'Breadcrumbs', 'Eggs']
  },
  {
    id: '17',
    name: 'Ube Pie',
    description: 'Flaky hand pie with a rich purple yam filling.',
    price: 5.00,
    category: 'pastry',
    image: '/images/ube_pie.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Butter', 'Ube halaya', 'Sugar', 'Eggs']
  },
  {
    id: '18',
    name: 'Ube Tsinelas',
    description: 'Slipper-shaped soft bread swirled with ube and brushed with butter.',
    price: 5.00,
    category: 'pastry',
    image: '/images/ube_tsinelas.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Ube halaya', 'Butter', 'Sugar', 'Milk', 'Yeast']
  }
]
