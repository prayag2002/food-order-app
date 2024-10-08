import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import Order from "../models/order";

const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error fetching restaurant" });
  }
};

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ user: req.userId }); // Check if restaurant already exists
    if (existingRestaurant) {
      return res.status(409).json({ message: "Restaurant already exists" });
    }

    const imageUrl = await uploadImage(req.file as Express.Multer.File); // Upload image to cloudinary

    const restaurant = new Restaurant(req.body); // Create new restaurant object
    restaurant.imageUrl = imageUrl; // Set imageUrl to cloudinary url
    restaurant.user = new mongoose.Types.ObjectId(req.userId); // Set user to current user
    restaurant.lastUpdated = new Date(); // Set lastUpdated to current date
    await restaurant.save(); // Save restaurant to database

    res.status(201).send(restaurant); // Send restaurant object as response
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" }); // Send error response
  }
};

const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({
      user: req.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    restaurant.restaurantName = req.body.restaurantName;
    restaurant.address = req.body.address;
    restaurant.city = req.body.city;
    restaurant.country = req.body.country;
    restaurant.deliveryPrice = req.body.deliveryPrice;
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime;
    restaurant.cuisines = req.body.cuisines;
    restaurant.menuItems = req.body.menuItems;
    restaurant.lastUpdated = new Date();

    if (req.file) {
      const imageUrl = await uploadImage(req.file as Express.Multer.File);
      restaurant.imageUrl = imageUrl;
    }

    await restaurant.save();
    res.status(200).send(restaurant);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const getMyRestaurantOrders = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "restaurant not found" });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("restaurant")
      .populate("user");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    const restaurant = await Restaurant.findById(order.restaurant);

    if (restaurant?.user?._id.toString() !== req.userId) {
      return res.status(401).send();
    }

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "unable to update order status" });
  }
};

// Function to upload image to cloudinary
const uploadImage = async (file: Express.Multer.File) => {
  const image = file; // Get image from request
  const base64Image = Buffer.from(image.buffer).toString("base64"); // Convert image to base64
  const dataURI = `data:${image.mimetype};base64,${base64Image}`; // Create data uri

  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI); // Upload image to cloudinary
  return uploadResponse.url; // Return image url
};

export default {
  getMyRestaurantOrders,
  updateOrderStatus,
  getMyRestaurant,
  createMyRestaurant,
  updateMyRestaurant,
};
