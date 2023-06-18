### Color scale

###### *Archimed spiral in polar coordinate system*
```
r(f) = b + kf
b = 0
f = 0 .. 360
k = r / f = 255 / 360

r(f) = 255 / 360 f
```

r = 0 .. 255

f = 0 .. 360

###### *Separate color channels:*
```
ab = 0 .. 60 .. 120 -> blue = 255
ag = 120 .. 180 .. 240 -> green = 255
ar = 240 .. 300 .. 360 -> red = 255
```

```
acb = 60
acg = 180
acr = 300
```

```
da = |a - ac|
r(da > 60) = 0
r(0 < da < 60) = 255
```

```
r(0) = 255
r(60) = 0

r = b + ka
b = 255
r(60) = 255 + k * 60 = 0
k = -255 / 60

r(da) = 255 - 255 * a / 60
```

```
60 - 255
120 - 0

r(a) = b + ka
r(60) = 255 = b + k*60
r(120) = 0 = b + k*120

b = -120k
255 = -120k + 60k
255 = -60k
k = -255/60
b = 510

r(a) = 510 - 255a/60
```

```
255 - r
0 - 255

rf(d) = kd + b

rf(255) = r = 255k + b
rf(0) = 255 = b
b = 255
r = 255k + 255
k = (r - 255) / 255
```

###### *Initial channel intensity (final radius) should be adjusted according to the radius for the actual point*
`rf(d) = (r - 255) * d / 255 + 255`


```
scaleMin = n
scaleMax = m
n - 0
m - 360

f = kl + b
n = b
m = 360k + n

b = n
k = (m - n) / 360
```



