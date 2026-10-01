import { useState } from 'react';
try {
  useState(0);
} catch (e) {
  console.log(e.message);
}
