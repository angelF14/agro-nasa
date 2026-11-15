import { getAgronomistStatus } from '../_agronomist-core.mjs';

export default function handler(_req, res) {
  res.status(200).json(getAgronomistStatus());
}
