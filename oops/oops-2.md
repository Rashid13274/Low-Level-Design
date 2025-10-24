# OOP Interview Questions - TypeScript (Continued)

I'll continue with comprehensive OOP questions covering Inheritance, Polymorphism, Abstraction, SOLID Principles, and Design Patterns using TypeScript.

***

## Section 2: Inheritance and Polymorphism

### Q3: Inheritance - Method Resolution and Memory

```typescript
// Animal hierarchy for a Zoo Management System

class Animal {
  protected name: string;
  protected age: number;
  private static totalAnimals: number = 0;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
    Animal.totalAnimals++;
  }
  
  public makeSound(): string {
    return "Some generic animal sound";
  }
  
  public getInfo(): string {
    return `${this.name} is ${this.age} years old`;
  }
  
  public eat(): string {
    return `${this.name} is eating`;
  }
  
  public static getTotalAnimals(): number {
    return Animal.totalAnimals;
  }
}

class Dog extends Animal {
  private breed: string;
  
  constructor(name: string, age: number, breed: string) {
    super(name, age);
    this.breed = breed;
  }
  
  // Method overriding
  public makeSound(): string {
    return "Woof! Woof!";
  }
  
  // Method overriding with super call
  public getInfo(): string {
    return `${super.getInfo()} and is a ${this.breed}`;
  }
  
  // New method specific to Dog
  public fetch(): string {
    return `${this.name} is fetching the ball`;
  }
}

class Cat extends Animal {
  private indoor: boolean;
  
  constructor(name: string, age: number, indoor: boolean) {
    super(name, age);
    this.indoor = indoor;
  }
  
  public makeSound(): string {
    return "Meow!";
  }
  
  public getInfo(): string {
    const location = this.indoor ? "indoor" : "outdoor";
    return `${super.getInfo()} and is an ${location} cat`;
  }
  
  public climb(): string {
    return `${this.name} is climbing`;
  }
}

class GermanShepherd extends Dog {
  private trained: boolean;
  
  constructor(name: string, age: number, trained: boolean) {
    super(name, age, "German Shepherd");
    this.trained = trained;
  }
  
  // Override parent's override
  public makeSound(): string {
    return this.trained ? "Woof! (on command)" : super.makeSound();
  }
  
  public guard(): string {
    return `${this.name} is guarding the property`;
  }
}

// Testing scenario:
const animal: Animal = new Animal("Generic", 5);
const dog: Dog = new Dog("Buddy", 3, "Labrador");
const cat: Cat = new Cat("Whiskers", 2, true);
const shepherd: GermanShepherd = new GermanShepherd("Rex", 4, true);

// Polymorphism in action
const zoo: Animal[] = [animal, dog, cat, shepherd];

console.log(zoo[0].makeSound());  // Line A
console.log(zoo[1].makeSound());  // Line B
console.log(zoo[2].makeSound());  // Line C
console.log(zoo[3].makeSound());  // Line D

// Attempting to call subclass-specific methods
console.log(zoo[1].fetch());      // Line E
console.log(zoo[3].guard());      // Line F
```

**Question:** Which lines will compile successfully, and what will be the output of Lines A-D?

A) Lines A-D compile and output: "Some generic animal sound", "Woof! Woof!", "Meow!", "Woof! (on command)". Lines E-F cause compilation errors.  
B) All lines compile successfully with polymorphic behavior  
C) Lines A-D compile with same output for all. Lines E-F work.  
D) Lines A-D fail because of type mismatch

**Answer: A) Lines A-D compile and output different sounds based on runtime type. Lines E-F cause compilation errors.**

**Explanation:**
This demonstrates **runtime polymorphism** (dynamic dispatch) and **compile-time type checking**. The array type is `Animal[]`, so the compiler only allows calling methods defined in the `Animal` class, even though the actual objects are subclasses.

**Inheritance and Polymorphism Deep Dive:**

```typescript
// ===================================================================
// PART 1: INHERITANCE FUNDAMENTALS
// ===================================================================

// Base class (Parent/Superclass)
class Vehicle {
  protected brand: string;
  protected year: number;
  private vin: string;  // Private - not inherited in the traditional sense
  
  constructor(brand: string, year: number, vin: string) {
    this.brand = brand;
    this.year = year;
    this.vin = vin;
  }
  
  public start(): void {
    console.log(`${this.brand} is starting...`);
  }
  
  public stop(): void {
    console.log(`${this.brand} is stopping...`);
  }
  
  public getAge(): number {
    return new Date().getFullYear() - this.year;
  }
  
  protected getVIN(): string {
    return this.vin;
  }
  
  public displayInfo(): void {
    console.log(`Brand: ${this.brand}, Year: ${this.year}`);
  }
}

// Derived class (Child/Subclass)
class Car extends Vehicle {
  private numberOfDoors: number;
  private fuelType: string;
  
  constructor(brand: string, year: number, vin: string, doors: number, fuelType: string) {
    // MUST call super() before accessing 'this'
    super(brand, year, vin);
    this.numberOfDoors = doors;
    this.fuelType = fuelType;
  }
  
  // ✅ Can access protected members from parent
  public getVehicleDetails(): string {
    return `${this.brand} (${this.year}) - ${this.numberOfDoors} doors, ${this.fuelType}`;
  }
  
  // ✅ Can call protected methods from parent
  public showVIN(): void {
    console.log(`VIN: ${this.getVIN()}`);
  }
  
  // ❌ CANNOT access private members from parent
  // public showPrivateVIN(): void {
  //   console.log(this.vin); // ERROR! 'vin' is private to Vehicle
  // }
  
  // Method overriding - replacing parent's implementation
  public start(): void {
    console.log(`${this.brand} car is starting with a roar...`);
  }
  
  // Method overriding with super call - extending parent's behavior
  public displayInfo(): void {
    super.displayInfo(); // Call parent's version
    console.log(`Doors: ${this.numberOfDoors}, Fuel: ${this.fuelType}`);
  }
  
  // New method specific to Car
  public honk(): void {
    console.log("Beep! Beep!");
  }
}

// Multi-level inheritance
class ElectricCar extends Car {
  private batteryCapacity: number;
  private range: number;
  
  constructor(brand: string, year: number, vin: string, doors: number, batteryCapacity: number, range: number) {
    super(brand, year, vin, doors, "Electric");
    this.batteryCapacity = batteryCapacity;
    this.range = range;
  }
  
  // Override start from Car (which already overrode Vehicle's start)
  public start(): void {
    console.log(`${this.brand} electric car is starting silently...`);
  }
  
  // Override displayInfo from Car (which already overrode Vehicle's displayInfo)
  public displayInfo(): void {
    super.displayInfo(); // Call Car's version (which calls Vehicle's)
    console.log(`Battery: ${this.batteryCapacity} kWh, Range: ${this.range} miles`);
  }
  
  public charge(): void {
    console.log(`Charging ${this.brand}...`);
  }
}

// Usage and method resolution
const vehicle = new Vehicle("Generic", 2020, "VIN123");
const car = new Car("Toyota", 2022, "VIN456", 4, "Gasoline");
const electricCar = new ElectricCar("Tesla", 2023, "VIN789", 4, 75, 300);

vehicle.start();      // "Generic is starting..."
car.start();          // "Toyota car is starting with a roar..."
electricCar.start();  // "Tesla electric car is starting silently..."

vehicle.displayInfo();      // Shows: Brand, Year
car.displayInfo();          // Shows: Brand, Year, Doors, Fuel
electricCar.displayInfo();  // Shows: Brand, Year, Doors, Fuel, Battery, Range

/*
METHOD RESOLUTION ORDER (MRO):
When electricCar.start() is called:
1. Look in ElectricCar class ✅ Found! Execute it
2. If not found, look in Car class
3. If not found, look in Vehicle class
4. If not found, compilation error

When electricCar.displayInfo() is called:
1. ElectricCar.displayInfo() calls super.displayInfo()
2. Car.displayInfo() calls super.displayInfo()
3. Vehicle.displayInfo() executes base implementation
4. Then Car adds its info
5. Then ElectricCar adds its info
*/


// ===================================================================
// PART 2: POLYMORPHISM - ONE INTERFACE, MULTIPLE IMPLEMENTATIONS
// ===================================================================

// Polymorphism allows treating objects of different types uniformly
// through a common interface (base class or interface)

class Shape {
  protected color: string;
  
  constructor(color: string) {
    this.color = color;
  }
  
  // Method to be overridden by subclasses
  public calculateArea(): number {
    return 0; // Default implementation
  }
  
  public calculatePerimeter(): number {
    return 0;
  }
  
  public draw(): void {
    console.log(`Drawing a ${this.color} shape`);
  }
  
  public getInfo(): string {
    return `${this.color} shape with area ${this.calculateArea()}`;
  }
}

class Circle extends Shape {
  private radius: number;
  
  constructor(color: string, radius: number) {
    super(color);
    this.radius = radius;
  }
  
  // Polymorphic method - overrides parent
  public calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
  
  public calculatePerimeter(): number {
    return 2 * Math.PI * this.radius;
  }
  
  public draw(): void {
    console.log(`Drawing a ${this.color} circle with radius ${this.radius}`);
  }
}

class Rectangle extends Shape {
  private width: number;
  private height: number;
  
  constructor(color: string, width: number, height: number) {
    super(color);
    this.width = width;
    this.height = height;
  }
  
  public calculateArea(): number {
    return this.width * this.height;
  }
  
  public calculatePerimeter(): number {
    return 2 * (this.width + this.height);
  }
  
  public draw(): void {
    console.log(`Drawing a ${this.color} rectangle ${this.width}x${this.height}`);
  }
}

class Triangle extends Shape {
  private base: number;
  private height: number;
  private side1: number;
  private side2: number;
  
  constructor(color: string, base: number, height: number, side1: number, side2: number) {
    super(color);
    this.base = base;
    this.height = height;
    this.side1 = side1;
    this.side2 = side2;
  }
  
  public calculateArea(): number {
    return 0.5 * this.base * this.height;
  }
  
  public calculatePerimeter(): number {
    return this.base + this.side1 + this.side2;
  }
  
  public draw(): void {
    console.log(`Drawing a ${this.color} triangle`);
  }
}

// POLYMORPHISM IN ACTION
// Array of different shapes treated uniformly
const shapes: Shape[] = [
  new Circle("red", 5),
  new Rectangle("blue", 4, 6),
  new Triangle("green", 3, 4, 5, 5),
  new Circle("yellow", 3),
  new Rectangle("purple", 10, 2)
];

// Process all shapes uniformly
let totalArea = 0;
for (const shape of shapes) {
  // Polymorphic call - correct method called based on actual object type
  totalArea += shape.calculateArea();
  shape.draw();
}

console.log(`Total area of all shapes: ${totalArea.toFixed(2)}`);

// Function that works with any Shape
function printShapeInfo(shape: Shape): void {
  console.log(`Color: ${shape.color}`);
  console.log(`Area: ${shape.calculateArea().toFixed(2)}`);
  console.log(`Perimeter: ${shape.calculatePerimeter().toFixed(2)}`);
  console.log('---');
}

shapes.forEach(printShapeInfo);

/*
HOW POLYMORPHISM WORKS:
1. Variable type is Shape (base class)
2. Actual object is Circle, Rectangle, or Triangle (derived classes)
3. When shape.calculateArea() is called:
   - Runtime checks actual object type
   - Calls the appropriate overridden method
   - This is called "dynamic dispatch" or "late binding"

BENEFITS:
✅ Code reusability
✅ Flexibility - add new shapes without changing existing code
✅ Maintainability - common interface for different implementations
*/


// ===================================================================
// PART 3: METHOD OVERRIDING RULES AND GOTCHAS
// ===================================================================

class Payment {
  protected amount: number;
  protected currency: string;
  
  constructor(amount: number, currency: string = "USD") {
    this.amount = amount;
    this.currency = currency;
  }
  
  // Method to be overridden
  public process(): boolean {
    console.log(`Processing payment of ${this.amount} ${this.currency}`);
    return true;
  }
  
  public getDetails(): string {
    return `${this.amount} ${this.currency}`;
  }
  
  // Final method (cannot be overridden in TypeScript by convention)
  public readonly validateAmount = (): boolean => {
    return this.amount > 0;
  }
}

class CreditCardPayment extends Payment {
  private cardNumber: string;
  private cvv: string;
  
  constructor(amount: number, cardNumber: string, cvv: string) {
    super(amount, "USD");
    this.cardNumber = cardNumber;
    this.cvv = cvv;
  }
  
  // ✅ CORRECT: Override with same or more permissive access
  public process(): boolean {
    console.log("Validating credit card...");
    if (this.validateCard()) {
      console.log(`Processing credit card payment of ${this.amount} ${this.currency}`);
      return super.process(); // Call parent's implementation
    }
    return false;
  }
  
  private validateCard(): boolean {
    return this.cardNumber.length === 16 && this.cvv.length === 3;
  }
  
  // ✅ CORRECT: Override with additional info
  public getDetails(): string {
    return `${super.getDetails()} via Credit Card ending in ${this.cardNumber.slice(-4)}`;
  }
  
  // ❌ WRONG: Cannot override readonly property method
  // public readonly validateAmount = (): boolean => {
  //   return this.amount > 10; // Different logic
  // }
}

class PayPalPayment extends Payment {
  private email: string;
  
  constructor(amount: number, email: string) {
    super(amount, "USD");
    this.email = email;
  }
  
  public process(): boolean {
    console.log(`Processing PayPal payment for ${this.email}`);
    return super.process();
  }
  
  public getDetails(): string {
    return `${super.getDetails()} via PayPal (${this.email})`;
  }
}

// Polymorphic payment processing
function processPayments(payments: Payment[]): void {
  for (const payment of payments) {
    if (payment.validateAmount()) {
      const success = payment.process(); // Polymorphic call
      console.log(`Payment ${success ? 'successful' : 'failed'}: ${payment.getDetails()}`);
    } else {
      console.log('Invalid payment amount');
    }
  }
}

const payments: Payment[] = [
  new CreditCardPayment(100, "1234567812345678", "123"),
  new PayPalPayment(50, "user@example.com"),
  new Payment(75, "EUR")
];

processPayments(payments);


// ===================================================================
// PART 4: SUPER KEYWORD - ACCESSING PARENT MEMBERS
// ===================================================================

class Employee {
  protected name: string;
  protected baseSalary: number;
  
  constructor(name: string, baseSalary: number) {
    this.name = name;
    this.baseSalary = baseSalary;
  }
  
  public calculateSalary(): number {
    return this.baseSalary;
  }
  
  public getDetails(): string {
    return `Employee: ${this.name}, Salary: $${this.calculateSalary()}`;
  }
  
  public work(): void {
    console.log(`${this.name} is working`);
  }
}

class Manager extends Employee {
  private bonus: number;
  private teamSize: number;
  
  constructor(name: string, baseSalary: number, bonus: number, teamSize: number) {
    // super() MUST be called before accessing 'this'
    super(name, baseSalary);
    this.bonus = bonus;
    this.teamSize = teamSize;
  }
  
  // Override with super call - extending behavior
  public calculateSalary(): number {
    return super.calculateSalary() + this.bonus;
  }
  
  // Override with super call - extending behavior
  public getDetails(): string {
    return `${super.getDetails()}, Bonus: $${this.bonus}, Team Size: ${this.teamSize}`;
  }
  
  // Override completely replacing behavior
  public work(): void {
    console.log(`${this.name} is managing a team of ${this.teamSize}`);
    super.work(); // Can still call parent's version
    console.log(`${this.name} is also attending meetings`);
  }
  
  public conductMeeting(): void {
    console.log(`${this.name} is conducting a team meeting`);
  }
}

class Developer extends Employee {
  private programmingLanguages: string[];
  private experienceYears: number;
  
  constructor(name: string, baseSalary: number, languages: string[], experience: number) {
    super(name, baseSalary);
    this.programmingLanguages = languages;
    this.experienceYears = experience;
  }
  
  public calculateSalary(): number {
    // Experience bonus: $5000 per year
    const experienceBonus = this.experienceYears * 5000;
    return super.calculateSalary() + experienceBonus;
  }
  
  public getDetails(): string {
    return `${super.getDetails()}, Languages: ${this.programmingLanguages.join(', ')}, Experience: ${this.experienceYears} years`;
  }
  
  public work(): void {
    console.log(`${this.name} is coding in ${this.programmingLanguages[0]}`);
  }
  
  public writeCode(language: string): void {
    console.log(`${this.name} is writing ${language} code`);
  }
}

// Usage
const emp: Employee = new Employee("John", 50000);
const mgr: Manager = new Manager("Jane", 80000, 20000, 5);
const dev: Developer = new Developer("Bob", 70000, ["TypeScript", "Python", "Go"], 5);

console.log(emp.getDetails());
// "Employee: John, Salary: $50000"

console.log(mgr.getDetails());
// "Employee: Jane, Salary: $100000, Bonus: $20000, Team Size: 5"

console.log(dev.getDetails());
// "Employee: Bob, Salary: $95000, Languages: TypeScript, Python, Go, Experience: 5 years"

mgr.work();
// "Jane is managing a team of 5"
// "Jane is working"
// "Jane is also attending meetings"


// ===================================================================
// PART 5: INHERITANCE VS COMPOSITION - WHEN TO USE EACH
// ===================================================================

// ❌ BAD: Deep inheritance hierarchy (fragile)
class Bird {
  public fly(): void {
    console.log("Flying...");
  }
}

class Penguin extends Bird {
  // Problem: Penguins can't fly!
  public fly(): void {
    throw new Error("Penguins cannot fly!");
  }
}

// ✅ GOOD: Composition over inheritance
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

class FlyingBehavior implements Flyable {
  public fly(): void {
    console.log("Flying through the air...");
  }
}

class SwimmingBehavior implements Swimmable {
  public swim(): void {
    console.log("Swimming in water...");
  }
}

class Duck {
  private flyBehavior: Flyable;
  private swimBehavior: Swimmable;
  
  constructor() {
    this.flyBehavior = new FlyingBehavior();
    this.swimBehavior = new SwimmingBehavior();
  }
  
  public performFly(): void {
    this.flyBehavior.fly();
  }
  
  public performSwim(): void {
    this.swimBehavior.swim();
  }
}

class PenguinComposed {
  private swimBehavior: Swimmable;
  
  constructor() {
    this.swimBehavior = new SwimmingBehavior();
    // No fly behavior - penguins don't fly!
  }
  
  public performSwim(): void {
    this.swimBehavior.swim();
  }
}

/*
WHEN TO USE INHERITANCE:
✅ "IS-A" relationship (Dog IS-A Animal)
✅ Subclass is a specialized version of parent
✅ Need to override methods with specific behavior
✅ Shallow hierarchy (2-3 levels max)

WHEN TO USE COMPOSITION:
✅ "HAS-A" relationship (Car HAS-A Engine)
✅ Need flexibility to change behavior at runtime
✅ Avoid deep inheritance hierarchies
✅ Want to compose objects from reusable parts
*/


// ===================================================================
// PART 6: PROTECTED VS PRIVATE IN INHERITANCE
// ===================================================================

class BankAccount {
  private accountNumber: string;      // Only accessible in BankAccount
  protected balance: number;          // Accessible in BankAccount and subclasses
  public accountHolder: string;       // Accessible everywhere
  
  constructor(accountNumber: string, accountHolder: string, initialBalance: number) {
    this.accountNumber = accountNumber;
    this.accountHolder = accountHolder;
    this.balance = initialBalance;
  }
  
  protected deposit(amount: number): void {
    this.balance += amount;
  }
  
  protected withdraw(amount: number): boolean {
    if (amount <= this.balance) {
      this.balance -= amount;
      return true;
    }
    return false;
  }
  
  public getBalance(): number {
    return this.balance;
  }
  
  private getAccountNumber(): string {
    return this.accountNumber;
  }
}

class SavingsAccount extends BankAccount {
  private interestRate: number;
  
  constructor(accountNumber: string, accountHolder: string, initialBalance: number, rate: number) {
    super(accountNumber, accountHolder, initialBalance);
    this.interestRate = rate;
  }
  
  public addInterest(): void {
    // ✅ Can access protected member from parent
    const interest = this.balance * this.interestRate;
    
    // ✅ Can call protected method from parent
    this.deposit(interest);
    
    console.log(`Added interest: $${interest.toFixed(2)}`);
    console.log(`New balance: $${this.balance.toFixed(2)}`);
    
    // ❌ CANNOT access private member from parent
    // console.log(this.accountNumber); // ERROR!
    // this.getAccountNumber(); // ERROR!
  }
  
  public makeWithdrawal(amount: number): boolean {
    // ✅ Can call protected method from parent
    const success = this.withdraw(amount);
    
    if (success) {
      console.log(`Withdrew $${amount}. New balance: $${this.balance}`);
    } else {
      console.log("Insufficient funds");
    }
    
    return success;
  }
}

const savings = new SavingsAccount("ACC123", "Alice", 1000, 0.05);

// ✅ Public members accessible
console.log(savings.accountHolder);  // "Alice"
console.log(savings.getBalance());   // 1000

// ✅ Public methods in subclass accessible
savings.addInterest();  // Adds 5% interest
savings.makeWithdrawal(100);

// ❌ Protected members NOT accessible outside class hierarchy
// savings.balance = 999999; // ERROR!
// savings.deposit(100); // ERROR!
// savings.withdraw(100); // ERROR!


// ===================================================================
// KEY TAKEAWAYS
// ===================================================================

/*
INHERITANCE:
1. Use 'extends' keyword to create subclasses
2. Call super() in constructor before accessing 'this'
3. Subclasses inherit public and protected members
4. Private members are NOT accessible in subclasses
5. Method overriding allows changing parent's behavior
6. Use super.methodName() to call parent's method

POLYMORPHISM:
1. Same interface, different implementations
2. Base class reference can point to derived class object
3. Correct method called at runtime (dynamic dispatch)
4. Enables writing flexible, reusable code
5. Process different types uniformly through common interface

METHOD OVERRIDING:
1. Same method signature as parent
2. Can call parent's version with super.method()
3. Access modifier must be same or more permissive
4. Return type must be compatible (covariant)

COMPOSITION VS INHERITANCE:
1. Favor composition over inheritance (flexibility)
2. Inheritance: IS-A relationship
3. Composition: HAS-A relationship
4. Avoid deep hierarchies (max 2-3 levels)

ACCESS MODIFIERS IN INHERITANCE:
- public: Inherited and accessible everywhere
- protected: Inherited and accessible in subclasses only
- private: NOT inherited (not accessible in subclasses)

BEST PRACTICES:
✅ Keep inheritance hierarchies shallow
✅ Use protected for extension points
✅ Override methods to provide specific behavior
✅ Call super() when extending behavior
✅ Consider composition for flexibility
✅ Use polymorphism for uniform processing
*/
```

***

### Q4: Abstract Classes and Interfaces - Contract Definition

```typescript
// Payment processing system

abstract class PaymentProcessor {
  protected transactionId: string;
  protected amount: number;
  protected static transactionCount: number = 0;
  
  constructor(amount: number) {
    this.amount = amount;
    this.transactionId = `TXN-${++PaymentProcessor.transactionCount}`;
  }
  
  // Abstract method - must be implemented by subclasses
  abstract processPayment(): Promise<boolean>;
  
  // Abstract method with different signature
  abstract refund(reason: string): Promise<boolean>;
  
  // Concrete method - shared implementation
  public logTransaction(): void {
    console.log(`Transaction ${this.transactionId}: $${this.amount}`);
  }
  
  // Concrete method that uses abstract method
  public async executePayment(): Promise<boolean> {
    this.logTransaction();
    const result = await this.processPayment();
    console.log(result ? "Payment successful" : "Payment failed");
    return result;
  }
  
  // Template method pattern
  public async process(): Promise<boolean> {
    console.log("Starting payment process...");
    this.validate();
    const result = await this.processPayment();
    this.notifyResult(result);
    return result;
  }
  
  protected validate(): void {
    if (this.amount <= 0) {
      throw new Error("Invalid amount");
    }
  }
  
  protected notifyResult(success: boolean): void {
    console.log(`Payment ${success ? "completed" : "failed"}`);
  }
}

// Interface for notification capability
interface Notifiable {
  sendNotification(message: string): void;
  getNotificationChannel(): string;
}

// Interface for security features
interface Securable {
  encrypt(data: string): string;
  decrypt(data: string): string;
}

class StripePayment extends PaymentProcessor implements Notifiable {
  private apiKey: string;
  private customerEmail: string;
  
  constructor(amount: number, apiKey: string, email: string) {
    super(amount);
    this.apiKey = apiKey;
    this.customerEmail = email;
  }
  
  // Must implement abstract method
  public async processPayment(): Promise<boolean> {
    console.log("Processing Stripe payment...");
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1000);
    });
  }
  
  // Must implement abstract method
  public async refund(reason: string): Promise<boolean> {
    console.log(`Refunding via Stripe. Reason: ${reason}`);
    return true;
  }
  
  // Must implement interface method
  public sendNotification(message: string): void {
    console.log(`Email to ${this.customerEmail}: ${message}`);
  }
  
  // Must implement interface method
  public getNotificationChannel(): string {
    return "Email";
  }
}

class PayPalPayment extends PaymentProcessor implements Notifiable, Securable {
  private accountId: string;
  private phoneNumber: string;
  
  constructor(amount: number, accountId: string, phone: string) {
    super(amount);
    this.accountId = accountId;
    this.phoneNumber = phone;
  }
  
  public async processPayment(): Promise<boolean> {
    console.log("Processing PayPal payment...");
    const encryptedData = this.encrypt(this.accountId);
    console.log(`Using encrypted account: ${encryptedData}`);
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 800);
    });
  }
  
  public async refund(reason: string): Promise<boolean> {
    console.log(`Refunding via PayPal. Reason: ${reason}`);
    return true;
  }
  
  public sendNotification(message: string): void {
    console.log(`SMS to ${this.phoneNumber}: ${message}`);
  }
  
  public getNotificationChannel(): string {
    return "SMS";
  }
  
  public encrypt(data: string): string {
    return Buffer.from(data).toString('base64');
  }
  
  public decrypt(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
  }
}

// Attempting to instantiate abstract class
// const processor = new PaymentProcessor(100);  // Line A

// Using concrete implementations
const stripe = new StripePayment(100, "sk_test_123", "user@example.com");
const paypal = new PayPalPayment(50, "PP123456", "+1234567890");

// Polymorphism with abstract class
const processors: PaymentProcessor[] = [stripe, paypal];

for (const processor of processors) {
  await processor.executePayment();
}

// Interface-based polymorphism
function notifyCustomer(notifiable: Notifiable, message: string): void {
  console.log(`Sending via ${notifiable.getNotificationChannel()}`);
  notifiable.sendNotification(message);
}

notifyCustomer(stripe, "Payment received!");
notifyCustomer(paypal, "Payment processed!");

// Type checking
if (paypal instanceof PayPalPayment) {
  console.log(paypal.encrypt("secret"));
}
```

**Question:** What happens at Line A if uncommented, and what's the key difference between abstract classes and interfaces?

A) Line A compiles; Abstract classes and interfaces are the same in TypeScript  
B) Line A causes error "Cannot create instance of abstract class"; Abstract classes can have implementation, interfaces cannot  
C) Line A compiles; Interfaces can have implementation but abstract classes cannot  
D) Line A causes error; Both abstract classes and interfaces cannot be instantiated

**Answer: B) Line A causes compilation error "Cannot create an instance of an abstract class". Abstract classes can have concrete methods with implementation, while interfaces only define contracts.**

**Abstract Classes and Interfaces Deep Dive:**

```typescript
// ===================================================================
// PART 1: ABSTRACT CLASSES - PARTIAL IMPLEMENTATION
// ===================================================================

// Abstract class: Cannot be instantiated, meant to be inherited
abstract class Database {
  protected connectionString: string;
  protected isConnected: boolean = false;
  
  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }
  
  // Abstract method - no implementation, must be overridden
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract query(sql: string): Promise<any[]>;
  
  // Concrete method - shared implementation
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  // Concrete method using abstract method (Template Method Pattern)
  public async executeQuery(sql: string): Promise<any[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log(`Executing: ${sql}`);
    const results = await this.query(sql);
    console.log(`Retrieved ${results.length} rows`);
    
    return results;
  }
  
  // Concrete method with logic
  protected log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Concrete implementation 1
class MySQLDatabase extends Database {
  private pool: any;
  
  constructor(connectionString: string) {
    super(connectionString);
  }
  
  // Must implement all abstract methods
  public async connect(): Promise<void> {
    this.log("Connecting to MySQL...");
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isConnected = true;
    this.log("Connected to MySQL");
  }
  
  public async disconnect(): Promise<void> {
    this.log("Disconnecting from MySQL...");
    this.isConnected = false;
  }
  
  public async query(sql: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error("Not connected to database");
    }
    
    // MySQL-specific query logic
    console.log(`MySQL query: ${sql}`);
    return [{ id: 1, name: "Test" }];
  }
}

// Concrete implementation 2
class PostgreSQLDatabase extends Database {
  private client: any;
  
  constructor(connectionString: string) {
    super(connectionString);
  }
  
  public async connect(): Promise<void> {
    this.log("Connecting to PostgreSQL...");
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isConnected = true;
    this.log("Connected to PostgreSQL");
  }
  
  public async disconnect(): Promise<void> {
    this.log("Disconnecting from PostgreSQL...");
    this.isConnected = false;
  }
  
  public async query(sql: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error("Not connected to database");
    }
    
    // PostgreSQL-specific query logic
    console.log(`PostgreSQL query: ${sql}`);
    return [{ id: 2, name: "Test2" }];
  }
}

// ❌ ERROR: Cannot instantiate abstract class
// const db = new Database("connection_string");

// ✅ OK: Instantiate concrete implementations
const mysql = new MySQLDatabase("mysql://localhost:3306/mydb");
const postgres = new PostgreSQLDatabase("postgresql://localhost:5432/mydb");

// Polymorphism: Use abstract class as type
const databases: Database[] = [mysql, postgres];

for (const db of databases) {
  await db.executeQuery("SELECT * FROM users");
  console.log(`Connected: ${db.getConnectionStatus()}`);
}


// ===================================================================
// PART 2: INTERFACES - PURE CONTRACTS
// ===================================================================

// Interface: Pure contract, no implementation
interface Logger {
  log(message: string, level: string): void;
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
}

// Interface with readonly properties
interface User {
  readonly id: string;
  name: string;
  email: string;
  age?: number;  // Optional property
}

// Interface with method signatures
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Interface with index signature
interface Dictionary {
  [key: string]: any;
}

// Implementing interface
class ConsoleLogger implements Logger {
  public log(message: string, level: string): void {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
  
  public error(message: string): void {
    this.log(message, "error");
  }
  
  public warn(message: string): void {
    this.log(message, "warn");
  }
  
  public info(message: string): void {
    this.log(message, "info");
  }
}

class FileLogger implements Logger {
  private filePath: string;
  
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  
  public log(message: string, level: string): void {
    // Write to file
    console.log(`Writing to ${this.filePath}: [${level}] ${message}`);
  }
  
  public error(message: string): void {
    this.log(message, "error");
  }
  
  public warn(message: string): void {
    this.log(message, "warn");
  }
  
  public info(message: string): void {
    this.log(message, "info");
  }
}

// Using interface as type
function processWithLogger(logger: Logger, data: string): void {
  logger.info(`Processing: ${data}`);
  
  try {
    // Process data
    if (data.length === 0) {
      throw new Error("Empty data");
    }
    logger.info("Processing complete");
  } catch (error) {
    logger.error(`Processing failed: ${error.message}`);
  }
}

const consoleLogger = new ConsoleLogger();
const fileLogger = new FileLogger("/var/log/app.log");

processWithLogger(consoleLogger, "test data");
processWithLogger(fileLogger, "test data");


// ===================================================================
// PART 3: MULTIPLE INTERFACE IMPLEMENTATION
// ===================================================================

// TypeScript supports multiple interface implementation
interface Flyable {
  fly(): void;
  altitude: number;
}

interface Swimmable {
  swim(): void;
  depth: number;
}

interface Walkable {
  walk(): void;
  speed: number;
}

// Class implementing multiple interfaces
class Duck implements Flyable, Swimmable, Walkable {
  public altitude: number = 0;
  public depth: number = 0;
  public speed: number = 0;
  
  public fly(): void {
    this.altitude = 100;
    console.log(`Flying at altitude ${this.altitude}m`);
  }
  
  public swim(): void {
    this.depth = 2;
    console.log(`Swimming at depth ${this.depth}m`);
  }
  
  public walk(): void {
    this.speed = 5;
    console.log(`Walking at ${this.speed} km/h`);
  }
}

class Fish implements Swimmable {
  public depth: number = 0;
  
  public swim(): void {
    this.depth = 50;
    console.log(`Swimming at depth ${this.depth}m`);
  }
}

const duck = new Duck();
duck.fly();
duck.swim();
duck.walk();

// Interface-based polymorphism
function makeSwim(creature: Swimmable): void {
  creature.swim();
  console.log(`Current depth: ${creature.depth}m`);
}

makeSwim(duck);
makeSwim(new Fish());


// ===================================================================
// PART 4: INTERFACE EXTENSION (INHERITANCE)
// ===================================================================

// Base interface
interface Animal {
  name: string;
  age: number;
  makeSound(): void;
}

// Extended interface
interface Pet extends Animal {
  owner: string;
  isVaccinated: boolean;
  play(): void;
}

// Multiple interface extension
interface ServiceDog extends Pet {
  serviceType: string;
  assist(): void;
}

class GuideDog implements ServiceDog {
  public name: string;
  public age: number;
  public owner: string;
  public isVaccinated: boolean;
  public serviceType: string;
  
  constructor(name: string, age: number, owner: string) {
    this.name = name;
    this.age = age;
    this.owner = owner;
    this.isVaccinated = true;
    this.serviceType = "Guide";
  }
  
  public makeSound(): void {
    console.log("Woof!");
  }
  
  public play(): void {
    console.log(`${this.name} is playing`);
  }
  
  public assist(): void {
    console.log(`${this.name} is guiding ${this.owner}`);
  }
}


// ===================================================================
// PART 5: ABSTRACT CLASS VS INTERFACE - KEY DIFFERENCES
// ===================================================================

// Example showing when to use each

// Use ABSTRACT CLASS when:
// 1. Need to share code among related classes
// 2. Have common implementation logic
// 3. Need to define both abstract and concrete methods
// 4. Want to use access modifiers (private, protected)
// 5. Need constructors or state management

abstract class DataProcessor {
  protected data: any[];
  protected processedCount: number = 0;
  
  constructor(data: any[]) {
    this.data = data;
  }
  
  // Abstract method - must implement
  abstract process(item: any): any;
  
  // Concrete method - shared implementation
  public processAll(): any[] {
    const results = [];
    for (const item of this.data) {
      results.push(this.process(item));
      this.processedCount++;
    }
    this.logProgress();
    return results;
  }
  
  protected logProgress(): void {
    console.log(`Processed ${this.processedCount} items`);
  }
  
  public getCount(): number {
    return this.processedCount;
  }
}

class NumberProcessor extends DataProcessor {
  public process(item: any): number {
    return Number(item) * 2;
  }
}

class StringProcessor extends DataProcessor {
  public process(item: any): string {
    return String(item).toUpperCase();
  }
}

const numProcessor = new NumberProcessor([1, 2, 3]);
console.log(numProcessor.processAll()); // [2, 4, 6]

const strProcessor = new StringProcessor(["hello", "world"]);
console.log(strProcessor.processAll()); // ["HELLO", "WORLD"]


// Use INTERFACE when:
// 1. Define a contract for unrelated classes
// 2. Need multiple inheritance (multiple interfaces)
// 3. Want to define shape of objects
// 4. No implementation needed
// 5. Want maximum flexibility

interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

interface Cacheable {
  getCacheKey(): string;
  getCacheTTL(): number;
}

interface Comparable<T> {
  compareTo(other: T): number;
}

class Product implements Serializable, Cacheable, Comparable<Product> {
  constructor(
    public id: string,
    public name: string,
    public price: number
  ) {}
  
  public serialize(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      price: this.price
    });
  }
  
  public deserialize(data: string): void {
    const obj = JSON.parse(data);
    this.id = obj.id;
    this.name = obj.name;
    this.price = obj.price;
  }
  
  public getCacheKey(): string {
    return `product:${this.id}`;
  }
  
  public getCacheTTL(): number {
    return 3600; // 1 hour
  }
  
  public compareTo(other: Product): number {
    return this.price - other.price;
  }
}


// ===================================================================
// PART 6: COMBINING ABSTRACT CLASS AND INTERFACE
// ===================================================================

// Abstract class implementing interface
interface Drawable {
  draw(): void;
  clear(): void;
}

interface Movable {
  move(x: number, y: number): void;
}

abstract class Shape implements Drawable, Movable {
  protected x: number = 0;
  protected y: number = 0;
  protected color: string;
  
  constructor(color: string) {
    this.color = color;
  }
  
  // Implement interface method
  public move(x: number, y: number): void {
    this.x = x;
    this.y = y;
    console.log(`Moved to (${this.x}, ${this.y})`);
  }
  
  // Implement interface method
  public clear(): void {
    console.log("Clearing shape");
  }
  
  // Abstract method
  abstract calculateArea(): number;
  
  // Concrete method
  public display(): void {
    console.log(`${this.color} shape at (${this.x}, ${this.y})`);
  }
  
  // Abstract method from interface - to be implemented
  abstract draw(): void;
}

class CircleShape extends Shape {
  private radius: number;
  
  constructor(color: string, radius: number) {
    super(color);
    this.radius = radius;
  }
  
  public draw(): void {
    console.log(`Drawing ${this.color} circle with radius ${this.radius}`);
  }
  
  public calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class RectangleShape extends Shape {
  private width: number;
  private height: number;
  
  constructor(color: string, width: number, height: number) {
    super(color);
    this.width = width;
    this.height = height;
  }
  
  public draw(): void {
    console.log(`Drawing ${this.color} rectangle ${this.width}x${this.height}`);
  }
  
  public calculateArea(): number {
    return this.width * this.height;
  }
}

const circle = new CircleShape("red", 5);
circle.move(10, 20);
circle.draw();
console.log(`Area: ${circle.calculateArea()}`);


// ===================================================================
// KEY TAKEAWAYS
// ===================================================================

/*
ABSTRACT CLASSES:
✅ Can have both abstract and concrete methods
✅ Can have constructors
✅ Can have state (fields/properties)
✅ Can have access modifiers (private, protected, public)
✅ Cannot be instantiated directly
✅ Used for partial implementation
✅ Single inheritance only (extends one class)
✅ Use when classes are closely related

INTERFACES:
✅ Pure contracts (no implementation before TS 4.0)
✅ Cannot have constructors
✅ Cannot have state
✅ All members are public
✅ Cannot be instantiated
✅ Multiple interface implementation allowed
✅ Can extend multiple interfaces
✅ Use for unrelated classes sharing behavior

WHEN TO USE ABSTRACT CLASS:
- Sharing code among related classes
- Need constructors or state
- Want to use access modifiers
- Template Method pattern
- Common base functionality

WHEN TO USE INTERFACE:
- Defining contracts for unrelated classes
- Multiple inheritance needed
- No implementation required
- Dependency injection
- Mocking in tests
- Maximum flexibility

COMBINING BOTH:
- Abstract class implements interface(s)
- Provides partial implementation
- Subclasses complete the implementation
- Best of both worlds

BEST PRACTICES:
✅ Interface for capability (e.g., Serializable, Cacheable)
✅ Abstract class for shared implementation
✅ Prefer composition over inheritance
✅ Keep hierarchies shallow
✅ Use interfaces for loose coupling
✅ Document abstract methods clearly
*/
```

This comprehensive guide covers OOP fundamentals with practical TypeScript examples. Would you like me to continue with SOLID principles, Design Patterns, and more advanced OOP concepts?

[1](https://www.geeksforgeeks.org/typescript/typescript-interview-questions/)
[2](https://www.interviewbit.com/typescript-interview-questions/)
[3](https://zerotomastery.io/blog/typescript-interview-questions/)
[4](https://www.turing.com/interview-questions/typescript)
[5](https://www.interviewcoder.co/blog/typescript-interview-questions)
[6](https://arc.dev/talent-blog/typescript-interview-questions/)
[7](https://coderpad.io/interview-questions/typescript-interview-questions/)
[8](https://www.simplilearn.com/typescript-interview-questions-article)
[9](https://www.linkedin.com/pulse/top-20-typescript-interview-questions-answers-guide-shhreyansh-tiwari-mwqoc)