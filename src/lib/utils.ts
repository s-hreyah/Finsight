import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString('en-NP')}`;
}

type Point = [number, number];

type LinearRegressionResult = {
  m: number; // slope
  b: number; // intercept
};

function linearRegression(data: [number, number]): LinearRegressionResult {
  console.log("data: ", data)
  const n = data.length;

  if (n === 0) {
    throw new Error("Data array cannot be empty");
  }

  // single point case
  if (n === 1) {
    return {
      m: 0,
      b: data[0][1],
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;

  for (let i = 0; i < n; i++) {
    const [x, y] = data[i];

    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }

  const denominator = n * sumXX - sumX * sumX;

  // prevent division by zero
  if (denominator === 0) {
    return {
      m: 0,
      b: sumY / n,
    };
  }

  const m = (n * sumXY - sumX * sumY) / denominator;
  const b = sumY / n - (m * sumX) / n;
  console.log("m: ", m)
  console.log("b: ", b)
  return { m, b };
}
const fetchUserById = async (id: string) => {
  try {
    const docRef = doc(db, "users", id); // collection name + document ID
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      return docSnap.data();
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching document:", error);
  }
};
export default linearRegression;