import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getAppStatus(): string {
    return `
      <html>
        <head>
          <title>App Status</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .status { color: #2ecc71; font-weight: bold; font-size: 1.2rem; margin-bottom: 1rem; }
            a { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; transition: background 0.3s; }
            a:hover { background-color: #2980b9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Application Status</h1>
            <p class="status">● Running</p>
            <p>The application is online and functioning correctly.</p>
            <a href="/api">Go to Swagger API Docs</a>
          </div>
        </body>
      </html>
    `;
  }
}
