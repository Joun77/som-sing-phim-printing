import fs from 'fs';
const mainGoPath = 'admin-system/backend/cmd/fixture-server/main.go';
let code = fs.readFileSync(mainGoPath, 'utf8');
code = code.replace(
  'id := fmt.Sprintf("ord-fixture-%d", len(fixtureOrders)+1)',
  'id, _ := payload["id"].(string)\n\t\tif id == "" {\n\t\t\tid = fmt.Sprintf("ord-fixture-%d", len(fixtureOrders)+1)\n\t\t}'
);
code = code.replace('router.POST("/api/v1/orders"', 'router.POST("/api/orders", func(c *gin.Context) {\n\t\tc.Request.URL.Path = "/api/v1/orders"\n\t\trouter.HandleContext(c)\n\t})\n\trouter.POST("/api/v1/orders"');
fs.writeFileSync(mainGoPath, code);
