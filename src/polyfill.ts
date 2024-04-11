import { format } from 'date-fns';

Date.prototype.toJSON = function () {
  return format(this, 'yyyy-MM-dd HH:mm:ss');
};

(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};
